import {
  type FC,
  type ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { SessionStatusContext } from './sessionStatusContext'

import { useUser } from '../userContext/useUserContext'
import {
  DEFAULT_SESSION_LENGTH,
  FIRST_SESSION_LENGTH,
} from '../../constants/appConstants'

interface Props {
  children?: ReactElement
}

const SessionStatusProvider: FC<Props> = ({ children }) => {
  const { user, updateUser } = useUser()
  const [isSessionActive, setIsSessionActive] = useState(false)

  const setSessionLength = useCallback(
    (next: number) => {
      updateUser({ userDefaultSessionLength: next, showTour: false })
    },
    [updateUser]
  )

  const sessionLength = useMemo(() => {
    if (user?.showTour) return FIRST_SESSION_LENGTH
    return user?.userDefaultSessionLength ?? DEFAULT_SESSION_LENGTH
  }, [user?.showTour, user?.userDefaultSessionLength])

  return (
    <SessionStatusContext.Provider
      value={{
        isSessionActive,
        setIsSessionActive,
        sessionLength,
        setSessionLength,
      }}
    >
      {children}
    </SessionStatusContext.Provider>
  )
}

export default SessionStatusProvider
