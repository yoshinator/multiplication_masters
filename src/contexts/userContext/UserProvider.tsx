import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react'
import type { User } from '../../constants/dataModels'
import { type AuthStatus, UserContext } from './useUserContext'
import {
  doc,
  getDoc,
  getFirestore,
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

type Props = {
  children: ReactNode
}

const initialUser: Omit<User, 'uid' | 'username'> = {
  userRole: 'student',
  createdAt: null,
  lastLogin: null,
  activeGroup: 1,
  table: 12,
  totalAccuracy: 100,
  userDefaultSessionLength: 0,
  showTour: true,
  upgradePromptCount: 0,

  lifetimeCorrect: 0,
  lifetimeIncorrect: 0,
  totalSessions: 0,
  currentLevelProgress: 0,
  subscriptionStatus: 'free',
  newCardsSeenToday: 0,
  maxNewCardsPerDay: MAX_NEW_CARDS_PER_DAY,
}

const UserProvider: FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const logger = useLogger('UserProvider', true)
  const { app, auth, loadUserCards } = useFirebaseContext()

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

  /**
   * Load user cards subscription when user is authenticated.
   *
   * Note: Card initialization (copying 576 cards from master collection to user's
   * UserCards subcollection) is now handled server-side by the `initializeUserCards`
   * Cloud Function, which is triggered automatically when a new user document is created.
   * This eliminates the expensive client-side read/write operations that previously
   * blocked the UI.
   */
  useEffect(() => {
    if (!user?.uid) return

    let unsubscribe: Unsubscribe = () => {}

    // Load user cards directly - initialization is now handled server-side
    // by the Cloud Function triggered on user creation
    unsubscribe = loadUserCards(user.uid)

    return () => {
      unsubscribe()
    }
  }, [user?.uid, loadUserCards])

  // Firebase write for user
  const commitUserUpdates = useCallback(async () => {
    const uid = uidRef.current
    if (!app || !uid) return

    // save and clear the buffer
    const pending = omitUndefined(pendingUpdateRef.current)
    pendingUpdateRef.current = {}

    // Avoid calling updateDoc({}) which can be a no-op.
    if (Object.keys(pending).length === 0) return

    const db = getFirestore(app)
    const userRef = doc(db, 'users', uid)
    logger('User updated', pending)

    try {
      await updateDoc(userRef, pending)
      logger('User updated success', pending)
    } catch (error) {
      logger(`Error updating user ${error}`)
    }
  }, [app, logger])

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
    if (!auth || !app) return

    const db = getFirestore(app)
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
          }
        )
      } catch (error) {
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
  }, [auth, app, logger])

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
    <UserContext.Provider value={{ user, setUser, updateUser, authStatus }}>
      {children}
    </UserContext.Provider>
  )
}
export default UserProvider
