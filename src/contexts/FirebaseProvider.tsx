import type { FC, ReactNode } from 'react'
import { useMemo, useState, useCallback } from 'react'
import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import type { Analytics } from 'firebase/analytics'
import {
  FirebaseContext,
  type FirebaseContextValue,
  type UserCard,
} from './firebaseContext'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

type FirebaseProviderProps = {
  children: ReactNode
}

// Expect Vite env vars prefixed with VITE_FIREBASE_ (see README or .env)
const configFromEnv = () => {
  const env = import.meta.env
  // If any required var is missing, return null to avoid throwing at runtime
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

export const FirebaseProvider: FC<FirebaseProviderProps> = ({ children }) => {
  const [userCards, setUserCards] = useState<UserCard[]>([])

  const loadUserCards = useCallback(async (username: string) => {
    try {
      const cfg = configFromEnv()
      if (!cfg) return
      const app = getApps().length ? getApp() : initializeApp(cfg)
      const db = getFirestore(app)
      const userCardsCol = collection(db, 'users', username, 'UserCards')
      const snap = await getDocs(userCardsCol)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserCard)
      setUserCards(data)
    } catch {
      // ignore for now
    }
  }, [])

  const value = useMemo<FirebaseContextValue>(() => {
    try {
      const cfg = configFromEnv()
      if (!cfg)
        return {
          app: null,
          analytics: null,
          userCards: [],
          loadUserCards: async () => {},
        }

      // initialize only if not already initialized (useful in Vite HMR)
      const app = getApps().length ? getApp() : initializeApp(cfg)

      let analytics: Analytics | null = null
      try {
        analytics = getAnalytics(app)
      } catch {
        // analytics may fail in SSR or unsupported environments — ignore
        analytics = null
      }
      return { app, analytics, userCards: [], loadUserCards }
    } catch {
      return {
        app: null,
        analytics: null,
        userCards: [],
        loadUserCards: async () => {},
      }
    }
  }, [loadUserCards])

  // keep value stable while updating userCards separately via state
  const mergedValue = { ...value, userCards, loadUserCards }

  return (
    <FirebaseContext.Provider value={mergedValue}>
      {children}
    </FirebaseContext.Provider>
  )
}

export default FirebaseProvider
