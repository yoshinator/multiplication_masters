import { useRef, useCallback, useState, type FC, type ReactNode } from 'react'
import { getFirestore, doc, writeBatch } from 'firebase/firestore'
import { useFirebaseContext } from '../firebase/firebaseContext'
import type { UserCard } from '../firebase/firebaseContext'
import { useUser } from '../user/useUserContext'
import { ReviewSessionContext } from './reviewSessionContext'

interface Props {
  children: ReactNode
}

const defaultPendingUserCard = { correct: 0, incorrect: 0 }
const ReviewSessionProvider: FC<Props> = ({ children }) => {
  const { app, setUserCards } = useFirebaseContext()
  const { user } = useUser()
  const [updatedCards, setUpdatedCards] = useState<UserCard[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)

  const pendingUserCardsRef = useRef<Record<string, UserCard>>({})
  const pendingUserFieldsRef = useRef<Record<'correct' | 'incorrect', number>>({
    ...defaultPendingUserCard,
  })

  const addUpdatedCardToSession = useCallback((card: UserCard) => {
    // store latest version by id
    pendingUserCardsRef.current[card.id] = card
    setUpdatedCards(Object.values(pendingUserCardsRef.current))
    if (card.wasLastReviewCorrect) {
      pendingUserFieldsRef.current.correct += 1
      setCorrectCount(pendingUserFieldsRef.current.correct)
    } else {
      pendingUserFieldsRef.current.incorrect += 1
      setIncorrectCount(pendingUserFieldsRef.current.incorrect)
    }
    setUserCards?.((prev) => prev.map((c) => (c.id === card.id ? card : c)))
  }, [])

  const clearUpdates = useCallback(() => {
    pendingUserCardsRef.current = {}
    pendingUserFieldsRef.current = { ...defaultPendingUserCard }
    setUpdatedCards([])
  }, [])

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

  return (
    <ReviewSessionContext.Provider
      value={{
        updatedCards,
        addUpdatedCardToSession,
        flushUpdates,
        clearUpdates,
        correctCount,
        incorrectCount,
      }}
    >
      {children}
    </ReviewSessionContext.Provider>
  )
}

export default ReviewSessionProvider
