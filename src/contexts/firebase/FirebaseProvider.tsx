import type { FC, ReactNode } from 'react'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react' // Import useEffect
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import type { Analytics } from 'firebase/analytics'
import { FirebaseContext, type FirebaseContextValue } from './firebaseContext'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  onSnapshot,
  Firestore,
  query,
  orderBy,
  writeBatch,
  doc,
  getDocs,
} from 'firebase/firestore'
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
  type Unsubscribe,
} from 'firebase/auth'
import { seedCardsData } from '../../utilities/seedFirestore'
import { useLogger } from '../../hooks/useLogger'
import { type UserCard } from '../../constants/dataModels'

type Props = {
  children: ReactNode
}

interface T extends Window {
  firestoreDb: Firestore
  seedCards: () => Promise<{ seeded: boolean; reason?: string }>
}

// Expect Vite env vars prefixed with VITE_FIREBASE_ (see README or .env)
const configFromEnv = () => {
  const env = import.meta.env
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]

  for (const k of required) {
    if (!env[k]) return null
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  }
}

const FirebaseProvider: FC<Props> = ({ children }) => {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const isEmulatorConnectedRef = useRef(false)

  const logger = useLogger('Firebase Provider', true)

  const EMULATOR_HOST =
    location.hostname === 'localhost' ? 'localhost' : location.hostname

  const firebaseApp = useMemo<FirebaseApp | null>(() => {
    const cfg = configFromEnv()
    if (!cfg) return null
    return getApps().length ? getApp() : initializeApp(cfg)
  }, [])

  const firebaseAuth = useMemo<Auth | null>(() => {
    if (!firebaseApp) return null
    return getAuth(firebaseApp)
  }, [firebaseApp])

  const firestoreDb = useMemo<Firestore | null>(() => {
    if (!firebaseApp) return null
    return getFirestore(firebaseApp)
  }, [firebaseApp])

  const firebaseAnalytics = useMemo<Analytics | null>(() => {
    if (!firebaseApp) return null
    let analytics: Analytics | null = null
    try {
      analytics = getAnalytics(firebaseApp)
    } catch {
      analytics = null
    }
    return analytics
  }, [firebaseApp])

  // #region Emulator Connections
  // ONLY connect to the emulator if running locally
  useEffect(() => {
    if (!import.meta.env.DEV || !firestoreDb || isEmulatorConnectedRef.current)
      return

    connectFirestoreEmulator(firestoreDb, EMULATOR_HOST, 8080)
    isEmulatorConnectedRef.current = true
    logger(`Connected to Firestore emulator at ${EMULATOR_HOST}:8080`)
  }, [firestoreDb, EMULATOR_HOST, logger])

  useEffect(() => {
    if (!import.meta.env.DEV || !firebaseAuth) return

    connectAuthEmulator(firebaseAuth, `http://${EMULATOR_HOST}:9099`)
    logger(`Connected to Auth emulator at ${EMULATOR_HOST}:9099`)
  }, [firebaseAuth, EMULATOR_HOST, logger])

  const subscribeToUserCards = useCallback(
    (uid: string) => {
      if (!firestoreDb) return () => {}

      const userCardsCol = collection(firestoreDb, 'users', uid, 'UserCards')

      // Use orderBy to keep UserCards in a stable order; Firestore does not guarantee implicit ordering.
      const q = query(
        userCardsCol,
        orderBy('group'),
        orderBy('top'),
        orderBy('bottom')
      )
      return onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => {
            const raw = d.data() as Omit<UserCard, 'id'>
            return { ...raw, id: d.id } as UserCard
          })

          logger('🔄 Firestore pushed userCards count:', data.length)
          setUserCards(data)
        },
        (error) => {
          logger('❌ UserCards onSnapshot error:', error)
        }
      )
    },
    [firestoreDb, logger]
  )

  // #endregion
  const loadUserCards = useCallback(
    (uid: string): Unsubscribe => {
      logger('Loading user cards')
      if (!firestoreDb || !uid) return () => {}
      return subscribeToUserCards(uid)
    },
    [firestoreDb, subscribeToUserCards, logger]
  )

  const ensureUserCards = useCallback(
    async (uid: string) => {
      if (!firestoreDb || !uid) return

      const userCardsCol = collection(firestoreDb, 'users', uid, 'UserCards')

      const snap = await getDocs(userCardsCol)
      if (!snap.empty) {
        logger(`UserCards already exist for uid: ${uid}`)
        return
      }

      logger(`Seeding UserCards for uid: ${uid}`)

      const cardsCol = collection(firestoreDb, 'cards')
      const cardsSnap = await getDocs(cardsCol)

      const cards = cardsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))

      if (cards.length !== 576) {
        logger(`⚠️ Expected 576 cards, got ${cards.length}. Check seeding.`)
      }

      const CHUNK_SIZE = 500
      try {
        for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
          const batch = writeBatch(firestoreDb)
          for (const card of cards.slice(i, i + CHUNK_SIZE)) {
            batch.set(doc(userCardsCol, card.id), card)
          }
          await batch.commit()
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error)
        logger(`❌ Failed to initialize UserCards for uid: ${uid}. Error: ${message}`)
        throw error
      }

      logger(`✅ UserCards initialized for uid: ${uid}`)
    },
    [firestoreDb, logger]
  )

  /**
   * Kind of hacky but need to seed the database somehow.
   * Exposes db and seedCardsData globally in development mode after initialization
   * this should move to a pre-deployment script at some point.
   */
  useEffect(() => {
    if (import.meta.env.DEV && firestoreDb) {
      // Make Firestore DB instance available on window
      ;(window as unknown as T).firestoreDb = firestoreDb
      // Make seedCardsData function available on window, pre-bound with the db instance
      ;(window as unknown as T).seedCards = () => seedCardsData(firestoreDb)

      logger(
        '[DEV-ONLY] Firebase Firestore (window.firestoreDb) and seedCards (window.seedCards()) are available globally.'
      )
    }
  }, [firestoreDb, logger])

  const value = useMemo<FirebaseContextValue>(
    () => ({
      app: firebaseApp,
      analytics: firebaseAnalytics,
      auth: firebaseAuth,
      userCards,
      loadUserCards,
      setUserCards,
    }),
    [firebaseApp, firebaseAnalytics, firebaseAuth, userCards, loadUserCards]
  )
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export default FirebaseProvider
