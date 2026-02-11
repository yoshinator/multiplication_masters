import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
  useMemo,
} from 'react'
import {
  type PackMeta,
  type User,
  getPackFactIds,
  type UserSceneMeta,
} from '../../constants/dataModels'
import { type AuthStatus, UserContext } from './useUserContext'
import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { useLogger } from '../../hooks/useLogger'
import { useFirebaseContext } from '../firebase/firebaseContext'
import { omitUndefined } from '../../utilities/firebaseHelpers'
import { useCloudFunction } from '../../hooks/useCloudFunction'
import { useFirestoreDoc } from '../../hooks/useFirestore'
import { type SceneTheme } from '../../constants/sceneDefinitions'

type Props = {
  children: ReactNode
}

const UserProvider: FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const logger = useLogger('UserProvider')
  const { app, auth, db, loadUserFacts } = useFirebaseContext()

  /**
   * This guy is just accumulating field values during renders before
   * the debounce callback. This is no substitute for batch writes on
   * things like timer stops, resets, or when the queue empties.
   */
  const pendingUpdateRef = useRef<Partial<User>>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uidRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    uidRef.current = user?.uid
  }, [user?.uid])

  // Add this state to UserProvider
  const packMetaRef = useMemo(() => {
    if (!user?.uid || !user?.activePack || !db) return null
    return doc(db, 'users', user.uid, 'packMeta', user.activePack)
  }, [user?.uid, user?.activePack, db])

  const { data: activePackMeta, loading: isPackMetaLoading } =
    useFirestoreDoc<PackMeta>(packMetaRef)

  const activeSceneMetaRef = useMemo(() => {
    if (!user?.uid || !user?.activeScene || !db) return null
    return doc(db, 'users', user.uid, 'sceneMeta', user.activeScene)
  }, [user?.uid, user?.activeScene, db])

  const { data: activeSceneMeta, loading: isSceneMetaLoading } =
    useFirestoreDoc<UserSceneMeta>(activeSceneMetaRef)

  const { execute: migrateUserToFacts } = useCloudFunction('migrateUserToFacts')
  const { execute: ensureUserInitialized } = useCloudFunction(
    'ensureUserInitialized'
  )

  const ensureUserInitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const ensureUserInitInFlightRef = useRef(false)
  const missingUserDocSinceRef = useRef<number | null>(null)
  const signOutInFlightRef = useRef(false)
  const packMetaInitRef = useRef<string | null>(null)

  const isLoading =
    authStatus === 'loading' || isPackMetaLoading || isSceneMetaLoading

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = loadUserFacts(user.uid)
      return () => unsubscribe()
    }
  }, [user?.uid, loadUserFacts])

  // Automatic Migration Trigger
  useEffect(() => {
    // If we have a user, but they haven't been initialized for the new system yet
    if (!app || !user?.uid || user.metaInitialized === true) {
      return
    }
    logger('User not initialized. Attempting migration...')
    migrateUserToFacts()
      .then((result) => {
        logger('Migration result:', result?.data)
        // The function updates the user doc, which triggers onSnapshot,
        // updating 'user' -> 'metaInitialized: true', stopping this loop.
      })
      .catch((err) => logger('Migration failed:', err))
  }, [app, user?.uid, user?.metaInitialized, logger, migrateUserToFacts])

  const activePackFactIds = useMemo(() => {
    if (!user?.activePack) return new Set<string>()
    return getPackFactIds(user.activePack)
  }, [user?.activePack])

  useEffect(() => {
    if (!db || !user?.uid || !user.activePack) return
    if (activePackMeta || isPackMetaLoading) return
    if (!activePackFactIds || activePackFactIds.size === 0) return

    const initKey = `${user.uid}:${user.activePack}`
    if (packMetaInitRef.current === initKey) return
    const metaRef = doc(db, 'users', user.uid, 'packMeta', user.activePack)
    const fallbackMeta: PackMeta = {
      packName: user.activePack,
      totalFacts: activePackFactIds.size,
      isCompleted: false,
      nextSeqToIntroduce: 0,
      lastActivity: Date.now(),
    }

    packMetaInitRef.current = initKey

    setDoc(metaRef, fallbackMeta, { merge: true }).catch((err) => {
      if (packMetaInitRef.current === initKey) {
        packMetaInitRef.current = null
      }
      logger('Error initializing pack meta:', err)
    })
  }, [
    activePackFactIds,
    activePackMeta,
    db,
    isPackMetaLoading,
    logger,
    user?.activePack,
    user?.uid,
  ])

  // Pass activePackMeta into the Context value

  // Firebase write for user
  const commitUserUpdates = useCallback(async () => {
    const uid = uidRef.current
    if (!db || !uid) return

    // save and clear the buffer
    const pending = omitUndefined(pendingUpdateRef.current)
    pendingUpdateRef.current = {}

    // Avoid calling updateDoc({}) which can be a no-op.
    if (Object.keys(pending).length === 0) return

    const userRef = doc(db, 'users', uid)
    logger('Committing user updates:', pending)

    try {
      await updateDoc(userRef, pending)
      logger('User updates committed successfully')
    } catch (error) {
      logger(`Error updating user ${error}`)
    }
  }, [db, logger])

  // Used in context to update user in a debounced way.
  const updateUser = useCallback(
    (fields: Partial<User>) => {
      // Updating the UI, null check seems redundant.
      // It's not. prevUser can be null so keep it null until it's not
      setUser((prevUser: User | null) =>
        prevUser ? { ...prevUser, ...fields } : prevUser
      )

      pendingUpdateRef.current = {
        ...pendingUpdateRef.current,
        ...fields,
      }

      // This is the magic of the debounce. Rapid fire updates keep
      // clearing the timeout until there is no more then update below.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(commitUserUpdates, 300)
    },
    [commitUserUpdates]
  )

  const incrementSceneXP = useCallback(
    async (amount = 1) => {
      if (!db || !user?.uid) return
      const sceneId = user.activeScene || 'garden'
      const sceneMetaRef = doc(db, 'users', user.uid, 'sceneMeta', sceneId)

      try {
        // Use setDoc with merge: true to ensure the document exists.
        // updateDoc fails if the document is missing.
        await setDoc(
          sceneMetaRef,
          {
            sceneId,
            xp: increment(amount),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        logger('Error incrementing scene XP:', err)
      }
    },
    [db, user?.uid, user?.activeScene, logger]
  )

  const selectScene = useCallback(
    async (sceneId: SceneTheme) => {
      if (!db || !user?.uid) return

      const sceneMetaRef = doc(db, 'users', user.uid, 'sceneMeta', sceneId)

      try {
        const snap = await getDoc(sceneMetaRef)
        if (!snap.exists()) {
          const newMeta: Partial<UserSceneMeta> = {
            sceneId,
            xp: 0,
          }
          await setDoc(sceneMetaRef, {
            ...newMeta,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }

        updateUser({ activeScene: sceneId })
      } catch (err) {
        logger('Error selecting scene:', err)
      }
    },
    [db, user?.uid, updateUser, logger]
  )

  // Create user or set user if exists effect
  useEffect(() => {
    if (!auth || !db) return

    let userUnsubscribe: Unsubscribe | null = null
    let isCancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (userUnsubscribe) {
        userUnsubscribe()
        userUnsubscribe = null
      }

      if (ensureUserInitTimerRef.current) {
        clearTimeout(ensureUserInitTimerRef.current)
        ensureUserInitTimerRef.current = null
      }
      ensureUserInitInFlightRef.current = false
      missingUserDocSinceRef.current = null
      signOutInFlightRef.current = false

      if (isCancelled) return

      if (!authUser) {
        // Logged out update user state.
        setUser(null)
        setAuthStatus('signedOut')
        return
      }

      setAuthStatus('loading')

      try {
        const uid = authUser.uid
        const userRef = doc(db, 'users', uid)
        // Subscribe immediately. If the doc does not exist yet (e.g. server-side
        // init still in progress), stay in loading state until it appears.
        userUnsubscribe = onSnapshot(
          userRef,
          (docSnap) => {
            if (!docSnap.exists()) {
              setUser(null)
              setAuthStatus('loading')

              if (missingUserDocSinceRef.current == null) {
                missingUserDocSinceRef.current = Date.now()
              }

              const elapsedMs = Date.now() - missingUserDocSinceRef.current

              // Try to recover by asking the server to initialize the user doc.
              // This handles accounts created before the Auth onCreate initializer
              // existed, as well as slow/failed trigger delivery.
              if (
                !ensureUserInitInFlightRef.current &&
                !ensureUserInitTimerRef.current
              ) {
                ensureUserInitTimerRef.current = setTimeout(async () => {
                  ensureUserInitTimerRef.current = null
                  if (isCancelled) return

                  ensureUserInitInFlightRef.current = true
                  try {
                    await ensureUserInitialized()
                  } catch (err) {
                    logger('ensureUserInitialized failed:', err)
                  } finally {
                    ensureUserInitInFlightRef.current = false
                  }
                }, 1000)
              }

              // Don’t allow infinite loading. If we still have no user doc after
              // a reasonable window, sign out so the UI can recover.
              if (elapsedMs > 20000) {
                logger(
                  'User doc missing for too long; signing out to recover UI',
                  { uid, elapsedMs }
                )
                if (!signOutInFlightRef.current) {
                  signOutInFlightRef.current = true
                  void (async () => {
                    try {
                      await firebaseSignOut(auth)
                      // Let onAuthStateChanged drive state transitions.
                    } catch (err) {
                      logger('firebaseSignOut failed:', err)
                      signOutInFlightRef.current = false
                      // Avoid immediate re-attempt loops.
                      missingUserDocSinceRef.current = Date.now()
                    }
                  })()
                }
              }
              return
            }

            if (ensureUserInitTimerRef.current) {
              clearTimeout(ensureUserInitTimerRef.current)
              ensureUserInitTimerRef.current = null
            }
            ensureUserInitInFlightRef.current = false
            missingUserDocSinceRef.current = null

            const userData = docSnap.data() as User
            setUser(userData)
            setAuthStatus('signedIn')
          },
          (error) => {
            logger('Error listening to user document:', error)
            setAuthStatus('signedOut')
          }
        )

        // Best-effort update lastLogin. If the user doc hasn't been created yet,
        // this will throw 'not-found' and we can safely ignore it.
        try {
          await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
          })
        } catch (error: unknown) {
          const code =
            typeof error === 'object' && error !== null && 'code' in error
              ? String((error as { code?: unknown }).code)
              : null
          if (code !== 'not-found') {
            logger('Failed to update lastLogin:', error)
          }
        }
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'permission-denied'
        ) {
          logger(
            'Permission Denied: Check Firestore Rules for "users" collection.'
          )
        }
        logger('Failed to initialize or update user document:', error)
        setUser(null)
        setAuthStatus('signedOut')
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
      if (userUnsubscribe) {
        userUnsubscribe()
      }

      if (ensureUserInitTimerRef.current) {
        clearTimeout(ensureUserInitTimerRef.current)
        ensureUserInitTimerRef.current = null
      }
      ensureUserInitInFlightRef.current = false
      missingUserDocSinceRef.current = null
      signOutInFlightRef.current = false
    }
  }, [auth, db, logger, ensureUserInitialized])

  // Clean up effect no implicit return for readability.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
        commitUserUpdates()
      }
    }
  }, [commitUserUpdates])

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        authStatus,
        activePackMeta,
        isLoading,
        activePackFactIds,
        activeSceneMeta,
        incrementSceneXP,
        selectScene,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
export default UserProvider
