import { useCallback, useState } from 'react'

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
  type FieldValue,
} from 'firebase/firestore'
import useFirebase from '../../contexts/firebase/useFirebase'
import { useLogger } from '../../hooks/useLogger'
import { useUser } from '../../contexts/user/useUserContext'

export interface User {
  username: string
  createdAt: FieldValue | null
  activeGroup: number
  table: number
  totalAccuracy: number
  highestGroupAccuracy: number
  totalReps: number
}

const initialUser: User = {
  username: '',
  createdAt: null,
  activeGroup: 1,
  table: 12,
  totalAccuracy: 100,
  highestGroupAccuracy: 100,
  totalReps: 0,
}

export const useLogin = () => {
  const { app, loadUserCards } = useFirebase()
  const [cards, setCards] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)
  const { user, setUser } = useUser()
  const [error, setError] = useState<string | null>(null)
  const logger = useLogger('useLogin')

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
        let finalUser: User

        if (!userSnap.exists()) {
          finalUser = {
            ...initialUser,
            username,
            createdAt: serverTimestamp(),
          }
          await setDoc(userRef, finalUser)
        } else {
          finalUser = userSnap.data() as User
        }

        logger('User logged in:', finalUser)
        setUser(finalUser)
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
        // load user cards into context
        try {
          logger('Loading user cards for', username)
          await loadUserCards(username)
        } catch {
          logger('Failed to load user cards after login.')
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [app, loadUserCards, cards.length, logger]
  )

  return { login: handleLogin, cards, loading, error, user }
}
