import type { FC, ReactNode } from 'react'
import { useMemo, useState, useCallback, useEffect } from 'react' // Import useEffect
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import type { Analytics } from 'firebase/analytics'
import {
  FirebaseContext,
  type FirebaseContextValue,
  type UserCard,
} from './firebaseContext'
import {
  getFirestore,
  collection,
  getDocs,
  Firestore,
} from 'firebase/firestore'
import { seedCardsData } from '../../utilities/seedFirestore'
import { useLogger } from '../../hooks/useLogger'

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
  const logger = useLogger('Firebase Povider')

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

  const loadUserCards = useCallback(
    async (username: string) => {
      if (!firestoreDb) {
        console.error('Firestore not initialized for loadUserCards.')
        return
      }
      try {
        const userCardsCol = collection(
          firestoreDb,
          'users',
          username,
          'UserCards'
        )
        const snap = await getDocs(userCardsCol)
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as UserCard
        )
        logger('setting user cards. ', data)
        setUserCards(data)
      } catch (e) {
        console.error('Error loading user cards:', e)
      }
    },
    [firestoreDb]
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
  }, [firestoreDb])

  const value = useMemo<FirebaseContextValue>(() => {
    if (!firebaseApp || !firestoreDb) {
      return {
        app: null,
        analytics: null,
        userCards: [],
        loadUserCards: async () => {},
      }
    }

    return {
      app: firebaseApp,
      analytics: firebaseAnalytics,
      userCards: [], // userCards state will override this directly below
      loadUserCards,
    }
  }, [firebaseApp, firebaseAnalytics, firestoreDb, loadUserCards])

  // Merge context value with userCards state
  const mergedValue = { ...value, userCards, loadUserCards }

  return (
    <FirebaseContext.Provider value={mergedValue}>
      {children}
    </FirebaseContext.Provider>
  )
}

export default FirebaseProvider
