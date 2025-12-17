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
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
  updateDoc, // <--- IMPORTANT: Needed for atomic updates
} from 'firebase/firestore'
import { useFirebaseContext } from '../firebase/firebaseContext'
import type { User, UserCard } from '../../constants/dataModels'
import { useUser } from '../user/useUserContext'
import { ReviewSessionContext } from './reviewSessionContext'
import type { SessionRecord } from '../../constants/dataModels'
import { BOX_ADVANCE } from '../../constants/appConstants'
import { omitUndefined } from '../../utilities/firebaseHelpers'
import type { FieldValueAllowed } from '../../utilities/typeutils'
import { useLogger } from '../../hooks/useLogger'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'

interface Props {
  children: ReactNode
}

const defaultPendingUserCard = { correct: 0, incorrect: 0 }
const SAVE_THRESHOLD = 5 // <--- Auto-save every 5 cards

const ReviewSessionProvider: FC<Props> = ({ children }) => {
  const logger = useLogger()
  const { app, setUserCards } = useFirebaseContext()
  const [latestSession, setLatestSession] = useState<SessionRecord | null>(null)
  const [percentageMastered, setPercentageMastered] = useState(0)
  const { user, updateUser } = useUser()
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

  useEffect(() => {
    if (!app || !user) return

    const db = getFirestore(app)
    const sessionsCol = collection(db, 'users', user.username, 'Sessions')
    // Get the last session
    const q = query(sessionsCol, orderBy('endedAt', 'desc'), limit(1))

    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setLatestSession(null)
        return
      }
      setLatestSession(snap.docs[0].data() as SessionRecord)
    })

    return () => unsubscribe()
  }, [app, user])

  // 1. Helper to push pending cards and user stats to DB
  const commitSessionUpdates = useCallback(async () => {
    if (!app || !user) return
    const cards = Object.values(pendingUserCardsRef.current)

    // If nothing to save, return
    if (cards.length === 0) return

    const db = getFirestore(app)
    const batch = writeBatch(db)

    // A. Update Cards
    for (const card of cards) {
      const cardRef = doc(db, 'users', user.username, 'UserCards', card.id)
      const cleanCardPayload = omitUndefined(card)

      // Only update if there are fields left after cleaning
      if (Object.keys(cleanCardPayload).length > 0) {
        batch.update(cardRef, cleanCardPayload)
      }
    }

    // C. Commit and Clear Pending
    try {
      await batch.commit()
    } catch (e) {
      // Log the failure, but don't re-throw.
      logger('Auto-save failed, clearing local pending state:', e)
    } finally {
      // This block executes regardless of success or failure.
      // We must clear the local refs to prevent resending failed data.
      pendingUserCardsRef.current = {}
      pendingUserFieldsRef.current = { ...defaultPendingUserCard }
    }

    // Note: We do NOT reset sessionCorrectCount state here,
    // because the session is still active visually.
  }, [app, user])

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
    [setUserCards, commitSessionUpdates]
  )

  const resetSessionState = () => {
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
  }

  const finishSession = useCallback(
    async (
      sessionType: SessionRecord['sessionType'],
      sessionLength: number,
      percentageMastered: number
    ) => {
      if (!app || !user || !sessionStartRef.current) return
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

      // Final Flush (Save any remaining cards pending in the buffer)
      await commitSessionUpdates()

      const db = getFirestore(app)
      const ref = doc(collection(db, 'users', user.username, 'Sessions'))

      const userRef = doc(db, 'users', user.username)

      const userDBUpdates: FieldValueAllowed<User> = {
        totalSessions: increment(1),
        lifetimeCorrect: increment(finalCorrect),
        lifetimeIncorrect: increment(finalIncorrect),
      }
      const localUserUpdates: Partial<User> = {
        totalSessions: (user.totalSessions || 0) + 1,
      }

      if (percentageMastered >= 80) {
        userDBUpdates.activeGroup = user.activeGroup + 1
        localUserUpdates.activeGroup = user.activeGroup + 1
      }
      setPercentageMastered(percentageMastered)

      // Perform the combined database updates
      await updateDoc(userRef, userDBUpdates)

      // Update local state instantly for UX
      updateUser(localUserUpdates)

      const sessionRecord: SessionRecord = {
        userId: user.username,
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

      await setDoc(ref, omitUndefined(sessionRecord))

      resetSessionState()
    },
    [app, user, commitSessionUpdates, updateUser]
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
      }}
    >
      {children}
    </ReviewSessionContext.Provider>
  )
}

export default ReviewSessionProvider
