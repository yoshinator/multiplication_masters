import {
  useRef,
  useCallback,
  useState,
  type FC,
  type ReactNode,
  useEffect,
} from 'react'
import {
  getFirestore,
  doc,
  writeBatch,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
} from 'firebase/firestore'
import { useFirebaseContext } from '../firebase/firebaseContext'
import type { User, UserCard } from '../../constants/dataModels'
import { useUser } from '../userContext/useUserContext'
import { ReviewSessionContext } from './reviewSessionContext'
import type { SessionRecord } from '../../constants/dataModels'
import { BOX_ADVANCE } from '../../constants/appConstants'
import { omitUndefined } from '../../utilities/firebaseHelpers'
import {
  extractErrorMessage,
  type FieldValueAllowed,
} from '../../utilities/typeutils'
import { useLogger } from '../../hooks/useLogger'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'
import { percentMastered } from '../cardScheduler/helpers/srsLogic'

interface Props {
  children: ReactNode
}

const defaultPendingUserCard = { correct: 0, incorrect: 0 }
const SAVE_THRESHOLD = 5 // <--- Auto-save every 5 cards
const MASTERY_THRESHOLD = 80
const MAX_GROUPS = 8

const ReviewSessionProvider: FC<Props> = ({ children }) => {
  const logger = useLogger()
  const { app, setUserCards } = useFirebaseContext()
  const [latestSession, setLatestSession] = useState<SessionRecord | null>(null)
  const { user, updateUser } = useUser()
  const { userCards } = useFirebaseContext()
  const [percentageMastered, setPercentageMastered] = useState(
    user?.currentLevelProgress ?? 0
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setIsSessionActive } = useSessionStatusContext()

  const [isShowingAnswer, setIsShowingAnswer] = useState(false)
  const showAnswer = () => setIsShowingAnswer(true)

  const hideAnswer = () => setIsShowingAnswer(false)

  // Refs for logic
  const sessionStartRef = useRef<number | null>(null)
  const fastCorrectRef = useRef(0)
  const slowCorrectRef = useRef(0)
  const timeoutRef = useRef(0)
  const boxesAdvancedRef = useRef(0)
  const boxesRegressedRef = useRef(0)
  const totalElapsedRef = useRef(0)
  const totalAnswersRef = useRef(0)

  const statsByTableRef = useRef<
    Record<number, { correct: number; incorrect: number }>
  >({})

  const pendingUserCardsRef = useRef<Record<string, UserCard>>({})

  // Tracks pending changes that haven't been pushed to DB yet
  const pendingUserFieldsRef = useRef<Record<'correct' | 'incorrect', number>>({
    ...defaultPendingUserCard,
  })

  const getLatestMastery = useCallback(() => {
    if (!user || !userCards) return 0

    // Merge original cards with the ones we just updated in this session
    const currentSnapshot = userCards.map(
      (c) => pendingUserCardsRef.current[c.id] || c
    )

    return percentMastered(currentSnapshot, user.activeGroup, user.table)
  }, [user, userCards])

  useEffect(() => {
    if (user?.currentLevelProgress != null) {
      setPercentageMastered(user.currentLevelProgress)
    }
  }, [user?.currentLevelProgress])

  useEffect(() => {
    if (!app || !user?.uid) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const db = getFirestore(app)
    const sessionsCol = collection(db, 'users', user.uid, 'Sessions')
    // Get the last session
    const q = query(sessionsCol, orderBy('endedAt', 'desc'), limit(1))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setIsLoading(false)
        if (snap.empty) {
          setLatestSession(null)
          return
        }
        setLatestSession(snap.docs[0].data() as SessionRecord)
      },
      (error) => {
        setIsLoading(false)
        setError(extractErrorMessage(error))
        logger('Error loading session', error)
      }
    )

    return () => unsubscribe()
  }, [app, user, logger])

  // 1. Helper to push pending cards and user stats to DB
  const commitSessionUpdates = useCallback(async () => {
    if (!app || !user?.uid) return
    // Snapshot pending cards to handle concurrency and partial retries
    const cardsToSave = { ...pendingUserCardsRef.current }
    const cardIds = Object.keys(cardsToSave)

    // If nothing to save, return
    if (cardIds.length === 0) return

    setIsSaving(true)
    setError(null)

    const db = getFirestore(app)
    const batch = writeBatch(db)

    // A. Update Cards
    for (const card of Object.values(cardsToSave)) {
      const cardRef = doc(db, 'users', user.uid, 'UserCards', card.id)
      const cleanCardPayload = omitUndefined(card)

      // Only update if there are fields left after cleaning
      if (Object.keys(cleanCardPayload).length > 0) {
        batch.update(cardRef, cleanCardPayload)
      }
    }

    // C. Commit and Clear Pending
    try {
      await batch.commit()
      // On success, remove ONLY the cards we successfully saved.
      // This prevents race conditions if new cards were added during the await.
      for (const id of cardIds) {
        delete pendingUserCardsRef.current[id]
      }
      pendingUserFieldsRef.current = { ...defaultPendingUserCard }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      // Log the failure, but don't re-throw.
      // We intentionally DO NOT clear pendingUserCardsRef here so they are retried later.
      logger('Auto-save failed, keeping local pending state for retry:', e)
      setError(`Auto-save failed: ${msg}`)
    } finally {
      setIsSaving(false)
    }

    // Note: We do NOT reset sessionCorrectCount state here,
    // because the session is still active visually.
  }, [app, user, logger])

  const addUpdatedCardToSession = useCallback(
    (card: UserCard, oldBox: number) => {
      // 1. Update Refs
      pendingUserCardsRef.current[card.id] = card

      if (card.wasLastReviewCorrect) {
        pendingUserFieldsRef.current.correct += 1

        if (card.lastElapsedTime <= BOX_ADVANCE) fastCorrectRef.current++
        else slowCorrectRef.current++
      } else {
        pendingUserFieldsRef.current.incorrect += 1
      }

      // 2. Optimistic UI Update for Cards
      setUserCards?.((prev) => prev.map((c) => (c.id === card.id ? card : c)))

      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now()
        setIsSessionActive(true)
      }

      // 3. Update Statistics Refs
      const table = card.top
      if (!statsByTableRef.current[table]) {
        statsByTableRef.current[table] = { correct: 0, incorrect: 0 }
      }

      if (card.wasLastReviewCorrect) {
        statsByTableRef.current[table].correct++
      } else {
        statsByTableRef.current[table].incorrect++
      }

      totalElapsedRef.current += card.lastElapsedTime
      totalAnswersRef.current += 1

      if (oldBox < card.box) boxesAdvancedRef.current++
      if (oldBox > card.box) boxesRegressedRef.current++

      // 4. MICRO-BATCHING TRIGGER (The Fix for Tab Close)
      // If we have 5 or more pending cards, save them now.
      // This ensures that if the tab closes, at most 4 cards are lost.
      if (Object.keys(pendingUserCardsRef.current).length >= SAVE_THRESHOLD) {
        commitSessionUpdates()
      }
    },
    [setUserCards, commitSessionUpdates, setIsSessionActive]
  )

  const resetSessionState = useCallback(() => {
    sessionStartRef.current = null
    fastCorrectRef.current = 0
    slowCorrectRef.current = 0
    timeoutRef.current = 0
    boxesAdvancedRef.current = 0
    boxesRegressedRef.current = 0
    totalElapsedRef.current = 0
    totalAnswersRef.current = 0
    statsByTableRef.current = {}
    setIsSessionActive(false)

    // Clear refs manually just in case
    pendingUserCardsRef.current = {}
    pendingUserFieldsRef.current = { ...defaultPendingUserCard }
  }, [setIsSessionActive])

  const finishSession = useCallback(
    async (
      sessionLength: number,
      sessionType: SessionRecord['sessionType'] = 'multiplication'
    ) => {
      if (!app || !user?.uid) return

      if (!sessionStartRef.current) {
        resetSessionState()
        return
      }

      const currentPercentage = getLatestMastery()
      const finalCorrect = fastCorrectRef.current + slowCorrectRef.current
      const finalTotalAnswers = totalAnswersRef.current
      const finalIncorrect = finalTotalAnswers - finalCorrect

      const endedAt = Date.now()

      const statsByTableSnapshot = { ...statsByTableRef.current }
      const fastCorrect = fastCorrectRef.current
      const slowCorrect = slowCorrectRef.current
      const timeouts = timeoutRef.current
      const boxesAdvanced = boxesAdvancedRef.current
      const boxesRegressed = boxesRegressedRef.current

      const totalElapsed = totalElapsedRef.current
      const totalAnswers = totalAnswersRef.current

      // Safety Checks for Math
      const avgResponseTime = totalAnswers > 0 ? totalElapsed / totalAnswers : 0

      const accuracy =
        finalTotalAnswers > 0 ? finalCorrect / finalTotalAnswers : 0

      const sessionRecord: SessionRecord = {
        userId: user.uid,
        sessionType,
        sessionLength,
        startedAt: sessionStartRef.current,
        endedAt,
        durationMs: endedAt - sessionStartRef.current,
        correct: finalCorrect,
        incorrect: finalIncorrect,
        accuracy,
        avgResponseTime,
        fastCorrect,
        slowCorrect,
        timeouts,
        boxesAdvanced,
        boxesRegressed,
        statsByTable: statsByTableSnapshot,
      }

      // Capture pending cards before reset
      const pendingCards = Object.values(pendingUserCardsRef.current)

      // Optimistic UI Updates
      setLatestSession(sessionRecord)
      resetSessionState()

      setIsSaving(true)
      setError(null)

      // Background Database Updates
      const db = getFirestore(app)
      const batch = writeBatch(db)

      // A. Pending Cards
      for (const card of pendingCards) {
        const cardRef = doc(db, 'users', user.uid, 'UserCards', card.id)
        const cleanCardPayload = omitUndefined(card)
        if (Object.keys(cleanCardPayload).length > 0) {
          batch.update(cardRef, cleanCardPayload)
        }
      }

      // B. User Stats
      const userRef = doc(db, 'users', user.uid)
      const userDBUpdates: FieldValueAllowed<User> = {
        totalSessions: increment(1),
        lifetimeCorrect: increment(finalCorrect),
        lifetimeIncorrect: increment(finalIncorrect),
        currentLevelProgress: currentPercentage,
      }
      const localUserUpdates: Partial<User> = {
        totalSessions: (user.totalSessions || 0) + 1,
        currentLevelProgress: currentPercentage,
      }

      if (
        currentPercentage >= MASTERY_THRESHOLD &&
        user.activeGroup < MAX_GROUPS
      ) {
        userDBUpdates.activeGroup = user.activeGroup + 1
        userDBUpdates.currentLevelProgress = 0

        localUserUpdates.activeGroup = user.activeGroup + 1
        localUserUpdates.currentLevelProgress = 0
      }

      batch.update(userRef, userDBUpdates)
      updateUser(localUserUpdates)

      // C. Session Record
      const sessionRef = doc(collection(db, 'users', user.uid, 'Sessions'))
      batch.set(sessionRef, omitUndefined(sessionRecord))

      try {
        await batch.commit()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        logger('Failed to save session in background:', e)
        setError(`Failed to save session: ${msg}`)
      } finally {
        setIsSaving(false)
      }
    },
    [app, user, updateUser, resetSessionState, getLatestMastery, logger]
  )

  return (
    <ReviewSessionContext.Provider
      value={{
        addUpdatedCardToSession,
        // Ref changes do not cause re-renders. addUpdatedCardToSession does the trick.
        correctCount: fastCorrectRef.current + slowCorrectRef.current,
        incorrectCount:
          totalAnswersRef.current -
          (fastCorrectRef.current + slowCorrectRef.current),
        latestSession,
        pendingUserCards: pendingUserCardsRef.current,
        percentageMastered,
        isShowingAnswer,
        showAnswer,
        finishSession,
        hideAnswer,
        isLoading,
        isSaving,
        error,
      }}
    >
      {children}
    </ReviewSessionContext.Provider>
  )
}

export default ReviewSessionProvider
