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
} from 'firebase/firestore'
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

  const logger = useLogger('Firebase Provider')

  const EMULATOR_HOST =
    location.hostname === 'localhost' ? 'localhost' : location.hostname

  const firebaseApp = useMemo<FirebaseApp | null>(() => {
    const cfg = configFromEnv()
    if (!cfg) return null
    return getApps().length ? getApp() : initializeApp(cfg)
  }, [])

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

  // ONLY connect to the emulator if running locally
  useEffect(() => {
    if (!import.meta.env.DEV || !firestoreDb || isEmulatorConnectedRef.current)
      return

    connectFirestoreEmulator(firestoreDb, EMULATOR_HOST, 8080)
    isEmulatorConnectedRef.current = true
    logger(`Connected to Firestore emulator at ${EMULATOR_HOST}:8080`)
  }, [firestoreDb, EMULATOR_HOST, logger])

  const subscribeToUserCards = useCallback(
    (username: string) => {
      if (!firestoreDb) return () => {}

      const userCardsCol = collection(
        firestoreDb,
        'users',
        username,
        'UserCards'
      )

      // orderBy to stabilize order
      const q = query(userCardsCol, orderBy('id'))

      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as UserCard
        )
        logger('🔄 Firestore pushed new userCards:', data)
        setUserCards(data)
      })
    },
    [firestoreDb, logger]
  )

  const loadUserCards = useCallback(
    (username: string) => {
      logger('Loading user cards')
      if (!firestoreDb || !username) return () => {}

      return subscribeToUserCards(username)
    },
    [firestoreDb, subscribeToUserCards, logger]
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

  const value: FirebaseContextValue = {
    app: firebaseApp,
    analytics: firebaseAnalytics,
    userCards,
    loadUserCards,
    setUserCards,
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export default FirebaseProvider
