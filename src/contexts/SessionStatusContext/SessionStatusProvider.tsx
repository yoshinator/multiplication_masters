import {
  type FC,
  type ReactElement,
  useCallback,
  useRef,
  useState,
} from 'react'
import { SessionStatusContext } from './sessionStatusContext'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { useFirebaseContext } from '../firebase/firebaseContext'
import { useUser } from '../user/useUserContext'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { DEFAULT_SESSION_LENGTH } from '../../constants/appConstants'

interface Props {
  children?: ReactElement
}

// TODO: See about moving percentageMastered here.
const SessionStatusProvider: FC<Props> = ({ children }) => {
  const { app } = useFirebaseContext()
  const { user, setUser } = useUser()
  const [isSessionActive, setIsSessionActive] = useState(false)
  const prevSessionLength = useRef(user?.userDefaultSessionLength)

  const { debounced: persistSessionLength } = useDebouncedCallback(
    async (username: string, sessionLength: number) => {
      if (!app || !user) return
      const db = getFirestore(app)
      const userRef = doc(db, 'users', username)
      try {
        await updateDoc(userRef, { userDefaultSessionLength: sessionLength })
        prevSessionLength.current = sessionLength
      } catch {
        setUser({
          ...user,
          userDefaultSessionLength:
            prevSessionLength.current ?? DEFAULT_SESSION_LENGTH,
        })
      }
    },
    500
  )

  const setSessionLength = useCallback(
    (sessionLength: number) => {
      if (!user?.username) return

      // optimistic local update (instant UI)
      setUser({ ...user, userDefaultSessionLength: sessionLength })

      // debounced Firestore write
      persistSessionLength(user.username, sessionLength)
    },
    [persistSessionLength, setUser, user?.username]
  )

  return (
    <SessionStatusContext.Provider
      value={{
        isSessionActive,
        setIsSessionActive,
        sessionLength: user?.userDefaultSessionLength ?? DEFAULT_SESSION_LENGTH,
        setSessionLength,
      }}
    >
      {children}
    </SessionStatusContext.Provider>
  )
}

export default SessionStatusProvider
