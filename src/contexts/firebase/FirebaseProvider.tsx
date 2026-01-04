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
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
  type Unsubscribe,
} from 'firebase/auth'
import { useLogger } from '../../hooks/useLogger'
import { type UserCard } from '../../constants/dataModels'

type Props = {
  children: ReactNode
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
  const isAuthEmulatorConnectedRef = useRef(false)

  const logger = useLogger('Firebase Provider', true)

  const EMULATOR_HOST =
    import.meta.env.VITE_EMULATOR_HOST ||
    (['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'localhost'
      : window.location.hostname)

  const firebaseApp = useMemo<FirebaseApp | null>(() => {
    const cfg = configFromEnv()
    if (!cfg) return null
    return getApps().length ? getApp() : initializeApp(cfg)
  }, [])

  const firebaseAuth = useMemo<Auth | null>(() => {
    if (!firebaseApp) return null
    const auth = getAuth(firebaseApp)
    if (import.meta.env.DEV && auth) {
      if (!isAuthEmulatorConnectedRef.current) {
        connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
          disableWarnings: true,
        })
        isAuthEmulatorConnectedRef.current = true
        logger(`Connected to Auth emulator at ${EMULATOR_HOST}:9099`)
      }
    }
    return auth
  }, [firebaseApp, EMULATOR_HOST, logger])

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

  // ONLY connect to the FireStore emulator if running locally
  useEffect(() => {
    if (!import.meta.env.DEV || !firestoreDb || isEmulatorConnectedRef.current)
      return

    connectFirestoreEmulator(firestoreDb, EMULATOR_HOST, 8080)
    isEmulatorConnectedRef.current = true
    logger(`Connected to Firestore emulator at ${EMULATOR_HOST}:8080`)
  }, [firestoreDb, EMULATOR_HOST, logger])

  /**
   * Get's and sets the updated UserCards collection to be shared in the context
   */
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

  const loadUserCards = useCallback(
    (uid: string): Unsubscribe => {
      logger('Loading user cards')
      if (!firestoreDb || !uid) return () => {}
      return subscribeToUserCards(uid)
    },
    [firestoreDb, subscribeToUserCards, logger]
  )

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
