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
} from '../../constants/dataModels'
import { type AuthStatus, UserContext } from './useUserContext'
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useLogger } from '../../hooks/useLogger'
import { useFirebaseContext } from '../firebase/firebaseContext'
import { omitUndefined } from '../../utilities/firebaseHelpers'
import { MAX_NEW_CARDS_PER_DAY } from '../../constants/appConstants'
import { generateRandomUsername } from '../../utilities/accountHelpers'
import { useCloudFunction } from '../../hooks/useCloudFunction'
import { useFirestoreDoc } from '../../hooks/useFirestore'

type Props = {
  children: ReactNode
}

const initialUser: Omit<User, 'uid' | 'username'> = {
  userRole: 'student',
  createdAt: null,
  lastLogin: null,
  totalAccuracy: 100,
  userDefaultSessionLength: 0,
  showTour: true,
  upgradePromptCount: 0,

  lifetimeCorrect: 0,
  lifetimeIncorrect: 0,
  totalSessions: 0,
  subscriptionStatus: 'free',
  newCardsSeenToday: 0,
  maxNewCardsPerDay: MAX_NEW_CARDS_PER_DAY,
  enabledPacks: ['mul_36', 'mul_144'],
  activePack: 'mul_36',
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

  const { execute: migrateUserToFacts } = useCloudFunction('migrateUserToFacts')

  const isLoading = authStatus === 'loading' || isPackMetaLoading

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
        const userSnap = await getDoc(userRef)

        if (isCancelled) return

        const userData = userSnap.data()
        // Check if the user document exists and has been initialized.
        // We check for 'createdAt' to ensure we don't overwrite an existing valid user.
        if (!userSnap.exists() || !userData?.createdAt) {
          logger('Seeding initial user data...')
          const username = userData?.username || generateRandomUsername()
          await setDoc(
            userRef,
            {
              ...initialUser,
              uid,
              username,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          )
        } else {
          try {
            await updateDoc(userRef, {
              lastLogin: serverTimestamp(),
            })
          } catch {
            // If the document was deleted between the existence check and update,
            // fall back to setDoc with merge to recreate/update it without
            // treating this as a fatal auth error.
            await setDoc(
              userRef,
              {
                lastLogin: serverTimestamp(),
              },
              { merge: true }
            )
          }
        }

        if (isCancelled) return

        // Update user data and set signedIn.
        userUnsubscribe = onSnapshot(
          userRef,
          (docSnap) => {
            const userData = docSnap.data() as User
            if (userData) {
              setUser(userData)
              setAuthStatus('signedIn')
            } else {
              setUser(null)
              setAuthStatus('signedOut')
            }
          },
          (error) => {
            logger('Error listening to user document:', error)
            setAuthStatus('signedOut')
          }
        )
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
    }
  }, [auth, db, logger])

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
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
export default UserProvider
