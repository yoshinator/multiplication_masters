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
  increment, // <--- IMPORTANT: Needed for atomic updates
} from 'firebase/firestore'
import { useFirebaseContext } from '../firebase/firebaseContext'
import type { UserCard } from '../../constants/dataModels'
import { useUser } from '../user/useUserContext'
import { ReviewSessionContext } from './reviewSessionContext'
import type { SessionRecord } from '../../constants/dataModels'
import { BOX_ADVANCE } from '../../constants/appConstants'

interface Props {
  children: ReactNode
}

const defaultPendingUserCard = { correct: 0, incorrect: 0 }
const SAVE_THRESHOLD = 5 // <--- Auto-save every 5 cards

const ReviewSessionProvider: FC<Props> = ({ children }) => {
  const { app, setUserCards } = useFirebaseContext()
  const [latestSession, setLatestSession] = useState<SessionRecord | null>(null)
  const [isMastered, setIsMastered] = useState(false)
  const { user, updateUser } = useUser()

  // Renamed for clarity: These only track THIS active session
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0)
  const [sessionIncorrectCount, setSessionIncorrectCount] = useState(0)

  const [isSessionActive, setIsSessionActive] = useState(false)

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

  // 1. Helper to flush pending cards to DB
  const flushUpdates = useCallback(async () => {
    if (!app || !user) return
    const cards = Object.values(pendingUserCardsRef.current)

    // If nothing to save, return
    if (cards.length === 0) return

    const db = getFirestore(app)
    const batch = writeBatch(db)

    // A. Update Cards
    for (const card of cards) {
      const cardRef = doc(db, 'users', user.username, 'UserCards', card.id)
      batch.update(cardRef, card)
    }

    // B. Update User Lifetime Stats Atomically
    // We use 'increment' so multiple flushes add up correctly
    // without overwriting the total with just the session number.
    const userRef = doc(db, 'users', user.username)
    batch.update(userRef, {
      lifetimeCorrect: increment(pendingUserFieldsRef.current.correct),
      lifetimeIncorrect: increment(pendingUserFieldsRef.current.incorrect),
      // If you still want total answers tracked:
      totalAnswers: increment(cards.length),
    })

    // C. Commit and Clear Pending
    await batch.commit().catch((e) => console.error('Auto-save failed', e))

    // Only clear the PENDING refs (the ones we just saved)
    pendingUserCardsRef.current = {}
    pendingUserFieldsRef.current = { ...defaultPendingUserCard }

    // Note: We do NOT reset sessionCorrectCount state here,
    // because the session is still active visually.
  }, [app, user])

  const addUpdatedCardToSession = useCallback(
    (card: UserCard, oldBox: number) => {
      // 1. Update Refs
      pendingUserCardsRef.current[card.id] = card

      if (card.wasLastReviewCorrect) {
        pendingUserFieldsRef.current.correct += 1
        setSessionCorrectCount((prev) => prev + 1) // UI Update

        if (card.lastElapsedTime <= BOX_ADVANCE) fastCorrectRef.current++
        else slowCorrectRef.current++
      } else {
        pendingUserFieldsRef.current.incorrect += 1
        setSessionIncorrectCount((prev) => prev + 1) // UI Update
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
        flushUpdates()
      }
    },
    [setUserCards, flushUpdates]
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
    setSessionCorrectCount(0)
    setSessionIncorrectCount(0)
    setIsSessionActive(false)

    // Clear refs manually just in case
    pendingUserCardsRef.current = {}
    pendingUserFieldsRef.current = { ...defaultPendingUserCard }
  }

  const finishSession = useCallback(
    async (
      sessionType: SessionRecord['sessionType'],
      sessionLength: number,
      mastered: boolean
    ) => {
      if (!app || !user || !sessionStartRef.current) return

      const endedAt = Date.now()

      // Calculate totals based on State (which tracks the whole session)
      // We can't use pendingUserFieldsRef here because it might have been cleared by flushUpdates
      const correct = sessionCorrectCount
      const incorrect = sessionIncorrectCount

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
      const totalQuestions = correct + incorrect
      const accuracy = totalQuestions > 0 ? correct / totalQuestions : 0

      // Final Flush (Save any remaining cards pending in the buffer)
      await flushUpdates()

      const db = getFirestore(app)
      const ref = doc(collection(db, 'users', user.username, 'Sessions'))

      if (mastered) {
        const userRef = doc(db, 'users', user.username)
        setDoc(userRef, { activeGroup: user.activeGroup + 1 }, { merge: true })
        updateUser({ activeGroup: user.activeGroup + 1 })
      }

      setIsMastered(mastered)

      const sessionRecord: SessionRecord = {
        userId: user.username,
        sessionType,
        sessionLength,
        startedAt: sessionStartRef.current,
        endedAt,
        durationMs: endedAt - sessionStartRef.current,
        correct,
        incorrect,
        accuracy,
        avgResponseTime,
        fastCorrect,
        slowCorrect,
        timeouts,
        boxesAdvanced,
        boxesRegressed,
        statsByTable: statsByTableSnapshot,
      }

      await setDoc(ref, sessionRecord)

      resetSessionState()
    },
    [
      app,
      user,
      flushUpdates,
      sessionCorrectCount,
      sessionIncorrectCount,
      updateUser,
    ]
  )

  return (
    <ReviewSessionContext.Provider
      value={{
        addUpdatedCardToSession,
        correctCount: sessionCorrectCount, // Map to context API
        incorrectCount: sessionIncorrectCount, // Map to context API
        finishSession,
        isSessionActive,
        latestSession,
        pendingUserCards: pendingUserCardsRef.current,
        isMastered,
      }}
    >
      {children}
    </ReviewSessionContext.Provider>
  )
}

export default ReviewSessionProvider
