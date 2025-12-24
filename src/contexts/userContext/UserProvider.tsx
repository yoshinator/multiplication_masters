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
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useLogger } from '../../hooks/useLogger'
import { useFirebaseContext } from '../firebase/firebaseContext'
import { omitUndefined } from '../../utilities/firebaseHelpers'
import { DEFAULT_SESSION_LENGTH } from '../../constants/appConstants'

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
  userDefaultSessionLength: DEFAULT_SESSION_LENGTH,

  lifetimeCorrect: 0,
  lifetimeIncorrect: 0,
  totalSessions: 0,
  currentLevelProgress: 0,
  subscriptionStatus: 'free',
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
    if (!app || !user?.uid) return

    // save and clear the buffer
    const pending = omitUndefined(pendingUpdateRef.current)
    pendingUpdateRef.current = {}

    // Avoid calling updateDoc({}) which can be a no-op.
    if (Object.keys(pending).length === 0) return

    const db = getFirestore(app)
    const userRef = doc(db, 'users', user.uid)
    logger(`User ${pending} updated`)

    try {
      await updateDoc(userRef, pending)
      logger(`User ${pending} updated`)
    } catch (error) {
      logger(`Error updating user ${error}`)
    }
  }, [app, user, logger])

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

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
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
        const isNewUser =
          authUser.metadata.creationTime === authUser.metadata.lastSignInTime

        if (isNewUser) {
          await setDoc(
            userRef,
            {
              ...initialUser,
              uid,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          )
        } else {
          // updateDoc throws if the doc doesn't exist; fall back to merge-set
          try {
            await updateDoc(userRef, {
              lastLogin: serverTimestamp(),
            })
          } catch {
            await setDoc(
              userRef,
              { uid, lastLogin: serverTimestamp() },
              { merge: true }
            )
          }
        }

        //update user data and set signedIn.
        const fresh = await getDoc(userRef)
        setUser(fresh.data() as User)
        setAuthStatus('signedIn')
      } catch (error) {
        console.error('Failed to initialize or update user document:', error)
        setUser(null)
        setAuthStatus('signedOut')
      }
    })

    return unsubscribe
  }, [auth, app])

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
