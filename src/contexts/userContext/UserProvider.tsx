import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react'
import type { User } from '../../constants/dataModels'
import { UserContext } from './useUserContext'
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

const initialUser: User = {
  uid: '',
  username: '',
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
  const logger = useLogger('UserProvider', true)
  const { app, auth, ensureUserCards, loadUserCards } = useFirebaseContext()

  /**
   * This guy is just accumulating field values during renders before
   * the debounce callback. This is no substitute for batch writes on
   * things like timer stops, resets, or when the queue empties.
   */
  const pendingUpdateRef = useRef<Partial<User>>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef<boolean>(true)

  useEffect(() => {
    if (!user?.uid) return

    let unsubscribe: Unsubscribe = () => {}
    let cancelled = false

    ;(async () => {
      await ensureUserCards(user.uid)
      if (cancelled) return
      unsubscribe = loadUserCards(user.uid)
    })()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [user?.uid, ensureUserCards, loadUserCards])

  // Firebase write for user
  const commitUserUpdates = useCallback(async () => {
    if (!app || !user?.uid) return

    // save and clear the buffer
    const pending = omitUndefined(pendingUpdateRef.current)
    pendingUpdateRef.current = {}

    // If there are no pending updates, skip the write
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
        setUser(null)
        return
      }

      try {
        const uid = authUser.uid
        const userRef = doc(db, 'users', uid)
        const snap = await getDoc(userRef)

        if (!snap.exists()) {
          await setDoc(userRef, {
            ...initialUser,
            uid,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          })
        } else {
          await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
          })
        }

        const fresh = await getDoc(userRef)
        setUser(fresh.data() as User)
      } catch (error) {
        console.error('Failed to initialize or update user document:', error)
        setUser(null)
      }
    })

    return unsubscribe
  }, [auth, app])

  // Clean up effect no implicit return for readability.
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      // Clear any pending debounced timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Commit any pending updates immediately on unmount
      // We can't await this in a cleanup function, but we ensure
      // the promise is created before unmount completes
      if (Object.keys(pendingUpdateRef.current).length > 0) {
        void commitUserUpdates()
      }
    }
  }, [commitUserUpdates])

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
