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
import type { User, UserFact } from '../../constants/dataModels'
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
import { percentPackMastered } from '../cardScheduler/helpers/srsLogic'
import { useNotification } from '../notificationContext/notificationContext'

interface Props {
  children: ReactNode
}

const SAVE_THRESHOLD = 5 // <--- Auto-save every 5 facts

const ReviewSessionProvider: FC<Props> = ({ children }) => {
  const logger = useLogger()
  const { showNotification } = useNotification()
  const { app, setUserFacts, userFacts } = useFirebaseContext()
  const [latestSession, setLatestSession] = useState<SessionRecord | null>(null)
  const { user, updateUser, activePackMeta, activePackFactIds } = useUser()
  const [percentageMastered, setPercentageMastered] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const pendingUserFactsRef = useRef<Record<string, UserFact>>({})

  const getLatestMastery = useCallback(() => {
    if (!user || !userFacts || !activePackFactIds) return 0

    // Merge original facts with the ones we just updated in this session
    const currentSnapshot = userFacts.map(
      (c) => pendingUserFactsRef.current[c.id] || c
    )

    return percentPackMastered(
      currentSnapshot,
      activePackMeta,
      activePackFactIds
    )
  }, [user, userFacts, activePackMeta, activePackFactIds])

  useEffect(() => {
    setPercentageMastered(getLatestMastery())
  }, [getLatestMastery])

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
        showNotification(extractErrorMessage(error), 'error')
        logger('Error loading session', error)
      }
    )

    return () => unsubscribe()
  }, [app, user?.uid, logger, showNotification])

  // 1. Helper to push pending facts and user stats to DB
  const commitSessionUpdates = useCallback(async () => {
    if (!app || !user?.uid || isSaving) return
    // Snapshot pending facts to handle concurrency and partial retries
    const factsToSave = { ...pendingUserFactsRef.current }
    const factIds = Object.keys(factsToSave)

    // If nothing to save, return
    if (factIds.length === 0) return

    setIsSaving(true)

    const db = getFirestore(app)
    const batch = writeBatch(db)

    // A. Update Facts
    for (const fact of Object.values(factsToSave)) {
      const factRef = doc(db, 'users', user.uid, 'UserFacts', fact.id)
      const cleanFactPayload = omitUndefined(fact)

      // Only update if there are fields left after cleaning
      if (Object.keys(cleanFactPayload).length > 0) {
        batch.update(factRef, cleanFactPayload)
      }
    }

    // C. Commit and Clear Pending
    try {
      await batch.commit()
      // On success, remove ONLY the facts we successfully saved.
      // This prevents race conditions if new facts were added during the await.
      for (const id of factIds) {
        delete pendingUserFactsRef.current[id]
      }
    } catch (error) {
      const message = extractErrorMessage(error)
      // Log the failure, but don't re-throw.
      // We intentionally DO NOT clear pendingUserFactsRef here so they are retried later.
      logger(
        'Auto-save failed, keeping local pending state for retry:',
        message
      )
      showNotification(`Auto-save failed: ${message}`, 'error')
    } finally {
      setIsSaving(false)
    }

    // Note: We do NOT reset sessionCorrectCount state here,
    // because the session is still active visually.
  }, [app, user, logger, showNotification, isSaving])

  const addUpdatedFactToSession = useCallback(
    (fact: UserFact, oldBox: number) => {
      // 1. Update Refs
      pendingUserFactsRef.current[fact.id] = fact

      if (fact.wasLastReviewCorrect) {
        if (fact.lastElapsedTime <= BOX_ADVANCE) fastCorrectRef.current++
        else slowCorrectRef.current++
      }

      // 2. Optimistic UI Update for Facts
      setUserFacts?.((prev) => prev.map((c) => (c.id === fact.id ? fact : c)))

      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now()
        setIsSessionActive(true)
      }

      // 3. Update Statistics Refs
      const table = fact.operands[0]
      if (typeof table === 'number' && !statsByTableRef.current[table]) {
        statsByTableRef.current[table] = { correct: 0, incorrect: 0 }
      }

      if (typeof table === 'number' && fact.wasLastReviewCorrect) {
        statsByTableRef.current[table].correct++
      } else {
        statsByTableRef.current[table as number].incorrect++
      }

      totalElapsedRef.current += fact.lastElapsedTime
      totalAnswersRef.current += 1

      if (oldBox < fact.box) boxesAdvancedRef.current++
      if (oldBox > fact.box) boxesRegressedRef.current++

      // 4. MICRO-BATCHING TRIGGER (The Fix for Tab Close)
      // If we have 5 or more pending facts, save them now.
      // This ensures that if the tab closes, at most 4 facts are lost.
      if (Object.keys(pendingUserFactsRef.current).length >= SAVE_THRESHOLD) {
        commitSessionUpdates()
      }
    },
    [setUserFacts, commitSessionUpdates, setIsSessionActive]
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
    pendingUserFactsRef.current = {}
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

      // Capture pending facts before reset
      const pendingFacts = Object.values(pendingUserFactsRef.current)

      // Optimistic UI Updates
      setLatestSession(sessionRecord)
      resetSessionState()

      setIsSaving(true)

      // Background Database Updates
      const db = getFirestore(app)
      const batch = writeBatch(db)

      // A. Pending Facts
      for (const fact of pendingFacts) {
        const factRef = doc(db, 'users', user.uid, 'UserFacts', fact.id)
        const cleanFactPayload = omitUndefined(fact)
        if (Object.keys(cleanFactPayload).length > 0) {
          batch.update(factRef, cleanFactPayload)
        }
      }

      // B. User Stats
      const userRef = doc(db, 'users', user.uid)
      const userDBUpdates: FieldValueAllowed<User> = {
        totalSessions: increment(1),
        lifetimeCorrect: increment(finalCorrect),
        lifetimeIncorrect: increment(finalIncorrect),
      }
      const localUserUpdates: Partial<User> = {
        totalSessions: (user.totalSessions || 0) + 1,
      }

      batch.update(userRef, userDBUpdates)
      updateUser(localUserUpdates)

      // C. Session Record
      const sessionRef = doc(collection(db, 'users', user.uid, 'Sessions'))
      batch.set(sessionRef, omitUndefined(sessionRecord))

      try {
        await batch.commit()
      } catch (error) {
        const message = extractErrorMessage(error)
        logger('Failed to save session in background:', message)
        showNotification(`Failed to save session: ${message}`, 'error')
      } finally {
        setIsSaving(false)
      }
    },
    [app, user, updateUser, resetSessionState, logger, showNotification]
  )

  return (
    <ReviewSessionContext.Provider
      value={{
        addUpdatedFactToSession,
        // Ref changes do not cause re-renders. addUpdatedFactToSession does the trick.
        correctCount: fastCorrectRef.current + slowCorrectRef.current,
        incorrectCount:
          totalAnswersRef.current -
          (fastCorrectRef.current + slowCorrectRef.current),
        latestSession,
        pendingUserFacts: pendingUserFactsRef.current,
        percentageMastered,
        isShowingAnswer,
        showAnswer,
        finishSession,
        hideAnswer,
        isLoading,
        isSaving,
      }}
    >
      {children}
    </ReviewSessionContext.Provider>
  )
}

export default ReviewSessionProvider
