import { useCallback, useEffect, useState } from 'react'

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
  updateDoc,
} from 'firebase/firestore'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useLogger } from '../../hooks/useLogger'
import { useUser } from '../../contexts/user/useUserContext'
import type { User } from '../../constants/dataModels'
import { DEFAULT_SESSION_LENGTH } from '../../constants/appConstants'

const initialUser: User = {
  username: '',
  userRole: 'student',
  createdAt: null,
  lastLogin: null,
  activeGroup: 1,
  table: 12,
  totalAccuracy: 100,
  userDefaultSessionLength: DEFAULT_SESSION_LENGTH,

  lifetimeCorrect: 0,
  lifetimeIncorrect: 0,
  totalSessions: 0,
  subscriptionStatus: 'free',
}

export const useLogin = () => {
  const { app, loadUserCards } = useFirebaseContext()
  const [cards, setCards] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)
  const { user, setUser } = useUser()
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger('useLogin', true)

  useEffect(() => {
    if (!user?.username) return
    logger(`Loading user cards for ${user.username}`)
    const unsubscribe = loadUserCards(user.username)
    return () => unsubscribe && unsubscribe()
  }, [user?.username, loadUserCards, logger])

  const handleLogin = useCallback(
    async (username: string) => {
      setError(null)
      logger(`Logging in user: ${username}`)
      try {
        if (!app) {
          setError('Firebase app not initialized')
          return
        }

        setLoading(true)
        const db = getFirestore(app)

        // check/create user
        const userRef = doc(db, 'users', username)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            ...initialUser,
            username,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          })
        } else {
          await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
          })
        }

        const freshSnap = await getDoc(userRef)
        setUser(freshSnap.data() as User)

        logger('User logged in:', freshSnap.data())
        // ensure user has UserCards sub-collection; if empty, create copies
        const userCardsCol = collection(db, 'users', username, 'UserCards')
        const userCardsSnap = await getDocs(userCardsCol)
        if (userCardsSnap.empty) {
          // read all cards
          const cardsCol = collection(db, 'cards')
          const cardsSnap = await getDocs(cardsCol)
          const data = cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setCards(data)

          logger('cards', data)

          if (cards.length !== 576) {
            logger(
              `Expected 576 cards, but got ${cards.length} \
              check the seeding process or reseed.`
            )
          }

          // create a new doc per card using chunked writeBatch (max 500 ops per batch)
          const CHUNK_SIZE = 500
          const chunks: Array<typeof data> = []
          for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            chunks.push(data.slice(i, i + CHUNK_SIZE))
          }

          for (const chunkItems of chunks) {
            const batch = writeBatch(db)
            for (const card of chunkItems) {
              const maybeId = card as unknown as { id?: string }
              const id = maybeId.id || undefined
              const cardDocRef = id ? doc(userCardsCol, id) : doc(userCardsCol)
              batch.set(cardDocRef, card)
            }
            await batch.commit()
          }
          logger(`Initialized user UserCards for ${username}`)
        }
        loadUserCards(username)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [app, loadUserCards, cards.length, logger, setUser]
  )

  return { login: handleLogin, cards, loading, error, user }
}
