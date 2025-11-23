import { useCallback, useRef, useState, type FC, type ReactNode } from 'react'
import type { User } from '../../components/Login/useLogin'
import { UserContext } from './useUserContext'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { useLogger } from '../../hooks/useLogger'
import { useFirebaseContext } from '../firebase/firebaseContext'

type Props = {
  children: ReactNode
}

const UserProvider: FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const logger = useLogger('UserProvider')
  const { app } = useFirebaseContext()

  /**
   * This guy is just accumulating field values during renders before
   * the debounce callback. This is no substitute for batch writes on
   * things like timer stops, resets, or when the queue empties. I still
   * need to figure out sensible update times, or checkpoints.
   */
  const pendingUpdateRef = useRef<Partial<User>>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commitUserUpdates = useCallback(async () => {
    if (!app || !user) return

    // save and clear the buffer
    const pending = pendingUpdateRef.current
    pendingUpdateRef.current = {}

    const db = getFirestore(app)
    const userRef = doc(db, 'users', user.username)
    logger(`User ${pending} updated`)

    try {
      await updateDoc(userRef, pending)
      logger(`User ${pending} updated`)
    } catch (error) {
      logger(`Error updating user ${error}`)
    }
  }, [app, user, logger])

  const updateUser = useCallback(
    (fields: Partial<User>) => {
      // Updating the UI, null check seems redundant.
      // It's not. prevUser can be null so keep it null until its not
      setUser((prevUser) => (prevUser ? { ...prevUser, ...fields } : prevUser))

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

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
