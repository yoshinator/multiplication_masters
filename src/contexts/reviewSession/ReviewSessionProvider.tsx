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

const ReviewSessionProvider: FC<Props> = ({ children }) => {
  const { app, setUserCards } = useFirebaseContext()
  const [latestSession, setLatestSession] = useState<SessionRecord | null>(null)
  const [isMastered, setIsMastered] = useState(false)
  const { user, updateUser } = useUser()
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
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
  const pendingUserFieldsRef = useRef<Record<'correct' | 'incorrect', number>>({
    ...defaultPendingUserCard,
  })

  useEffect(() => {
    if (!app || !user) return

    const db = getFirestore(app)
    const sessionsCol = collection(db, 'users', user.username, 'Sessions')

    // newest session = orderBy endedAt desc, limit 1
    const q = query(sessionsCol, orderBy('endedAt', 'desc'), limit(1))

    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setLatestSession(null)
        return
      }

      const doc = snap.docs[0]
      setLatestSession(doc.data() as SessionRecord)
    })

    return () => unsubscribe()
  }, [app, user])

  const addUpdatedCardToSession = useCallback(
    (card: UserCard, oldBox: number) => {
      // store latest version by id
      pendingUserCardsRef.current[card.id] = card

      if (card.wasLastReviewCorrect) {
        pendingUserFieldsRef.current.correct += 1
        setCorrectCount(pendingUserFieldsRef.current.correct)
      } else {
        pendingUserFieldsRef.current.incorrect += 1
        setIncorrectCount(pendingUserFieldsRef.current.incorrect)
      }
      setUserCards?.((prev) => prev.map((c) => (c.id === card.id ? card : c)))
      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now()
        setIsSessionActive(true)
      }

      const table = card.top

      // initialize table stats
      if (!statsByTableRef.current[table]) {
        statsByTableRef.current[table] = { correct: 0, incorrect: 0 }
      }

      // overall counters
      if (card.wasLastReviewCorrect) {
        statsByTableRef.current[table].correct++
        // timing logic
        if (card.lastElapsedTime <= BOX_ADVANCE) fastCorrectRef.current++
        else slowCorrectRef.current++
      } else {
        statsByTableRef.current[table].incorrect++
        // maybe increment timeoutRef if forced timeout logic
      }

      // Total response time stats
      totalElapsedRef.current += card.lastElapsedTime
      totalAnswersRef.current += 1

      // SRS movement stats
      if (oldBox < card.box) boxesAdvancedRef.current++
      if (oldBox > card.box) boxesRegressedRef.current++
    },
    [setUserCards]
  )

  const clearUpdates = useCallback(() => {
    pendingUserCardsRef.current = {}
    pendingUserFieldsRef.current = { ...defaultPendingUserCard }
  }, [])

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
    setCorrectCount(0)
    setIncorrectCount(0)
    setIsSessionActive(false)
    clearUpdates()
  }

  const flushUpdates = useCallback(async () => {
    if (!app || !user) return
    const cards = Object.values(pendingUserCardsRef.current)
    if (cards.length === 0) return

    const db = getFirestore(app)
    const batch = writeBatch(db)

    for (const card of cards) {
      const cardRef = doc(db, 'users', user.username, 'UserCards', card.id)
      batch.update(cardRef, card)
    }

    const userRef = doc(db, 'users', user.username)
    batch.update(userRef, {
      ...user,
      correctCount: pendingUserFieldsRef.current.correct,
      incorrectCount: pendingUserFieldsRef.current.incorrect,
    })

    await batch.commit()
    clearUpdates()
  }, [app, clearUpdates, user])

  const finishSession = useCallback(
    async (
      sessionType: SessionRecord['sessionType'],
      sessionLength: number,
      mastered: boolean
    ) => {
      if (!app || !user || !sessionStartRef.current) return

      const endedAt = Date.now()

      const correct = pendingUserFieldsRef.current.correct
      const incorrect = pendingUserFieldsRef.current.incorrect
      const statsByTableSnapshot = { ...statsByTableRef.current }
      const fastCorrect = fastCorrectRef.current
      const slowCorrect = slowCorrectRef.current
      const timeouts = timeoutRef.current
      const boxesAdvanced = boxesAdvancedRef.current
      const boxesRegressed = boxesRegressedRef.current

      const totalElapsed = totalElapsedRef.current
      const totalAnswers = totalAnswersRef.current
      const avgResponseTime =
        totalAnswers > 0 ? totalElapsed / totalAnswers : null

      await flushUpdates() // this clears pendingUserFieldsRef

      const db = getFirestore(app)
      const ref = doc(collection(db, 'users', user.username, 'Sessions'))

      if (mastered) {
        const userRef = doc(db, 'users', user.username)
        // db update
        setDoc(userRef, { activeGroup: user.activeGroup + 1 }, { merge: true })
        // local UI update
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
        accuracy: correct / (correct + incorrect),
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
    [app, user, flushUpdates]
  )
  return (
    <ReviewSessionContext.Provider
      value={{
        addUpdatedCardToSession,
        correctCount,
        incorrectCount,
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
