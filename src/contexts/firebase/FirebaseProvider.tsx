import type { FC, ReactNode } from 'react'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions'
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
} from 'firebase/firestore'
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
  type Unsubscribe,
} from 'firebase/auth'
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage'
import { useLogger } from '../../hooks/useLogger'
import { type UserFact } from '../../constants/dataModels'

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
  const [userFacts, setUserFacts] = useState<UserFact[]>([])
  const isEmulatorConnectedRef = useRef(false)
  const isAuthEmulatorConnectedRef = useRef(false)
  const isFunctionsEmulatorConnectedRef = useRef(false)
  const isStorageEmulatorConnectedRef = useRef(false)

  const logger = useLogger('Firebase Provider')

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

  // ONLY connect to the FireStore emulator if running locally
  useEffect(() => {
    if (!import.meta.env.DEV || !firestoreDb || isEmulatorConnectedRef.current)
      return

    connectFirestoreEmulator(firestoreDb, EMULATOR_HOST, 8080)
    isEmulatorConnectedRef.current = true
    logger(`Connected to Firestore emulator at ${EMULATOR_HOST}:8080`)
  }, [firestoreDb, EMULATOR_HOST, logger])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!firebaseAuth) return
    if (isAuthEmulatorConnectedRef.current) return
    connectAuthEmulator(firebaseAuth, `http://${EMULATOR_HOST}:9099`, {
      disableWarnings: true,
    })
    isAuthEmulatorConnectedRef.current = true
    logger(`Connected to Auth emulator at ${EMULATOR_HOST}:9099`)
  }, [firebaseAuth, EMULATOR_HOST, logger])

  const firebaseFunctions = useMemo<Functions | null>(() => {
    if (!firebaseApp) return null
    return getFunctions(firebaseApp)
  }, [firebaseApp])

  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      !firebaseFunctions ||
      isFunctionsEmulatorConnectedRef.current
    )
      return

    // Port 5001 is the default for Functions
    connectFunctionsEmulator(firebaseFunctions, EMULATOR_HOST, 5001)
    isFunctionsEmulatorConnectedRef.current = true
    logger(`Connected to Functions emulator at ${EMULATOR_HOST}:5001`)
  }, [firebaseFunctions, EMULATOR_HOST, logger])

  const firebaseStorage = useMemo<FirebaseStorage | null>(() => {
    if (!firebaseApp) return null
    return getStorage(firebaseApp)
  }, [firebaseApp])

  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      !firebaseStorage ||
      isStorageEmulatorConnectedRef.current
    )
      return

    connectStorageEmulator(firebaseStorage, EMULATOR_HOST, 9199)
    isStorageEmulatorConnectedRef.current = true
    logger(`Connected to Storage emulator at ${EMULATOR_HOST}:9199`)
  }, [firebaseStorage, EMULATOR_HOST, logger])

  /**
   * Gets and sets the updated UserCards collection to be shared in the context
   */
  const subscribeToUserFacts = useCallback(
    (uid: string) => {
      if (!firestoreDb) return () => {}

      const userFactsCol = collection(firestoreDb, 'users', uid, 'UserFacts')
      const q = query(userFactsCol)

      return onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            ...(d.data() as UserFact),
            id: d.id,
          }))

          logger('🔄 Firestore pushed userFacts count:', data.length)
          setUserFacts(data)
        },
        (error) => {
          logger('❌ UserFacts onSnapshot error:', error)
        }
      )
    },
    [firestoreDb, logger]
  )

  const loadUserFacts = useCallback(
    (uid?: string): Unsubscribe => {
      logger('Loading user facts')
      if (!firestoreDb || !uid) return () => {}
      return subscribeToUserFacts(uid)
    },
    [firestoreDb, subscribeToUserFacts, logger]
  )
  const value = useMemo<FirebaseContextValue>(
    () => ({
      app: firebaseApp,
      analytics: firebaseAnalytics,
      auth: firebaseAuth,
      storage: firebaseStorage,
      userFacts,
      loadUserFacts,
      setUserFacts,
    }),
    [
      firebaseApp,
      firebaseAnalytics,
      firebaseAuth,
      firebaseStorage,
      userFacts,
      loadUserFacts,
    ]
  )
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export default FirebaseProvider
