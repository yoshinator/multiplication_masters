import { type FC, type ReactElement, useCallback, useState } from 'react'
import { SessionStatusContext } from './sessionStatusContext'

import { useUser } from '../userContext/useUserContext'
import { DEFAULT_SESSION_LENGTH } from '../../constants/appConstants'

interface Props {
  children?: ReactElement
}

const SessionStatusProvider: FC<Props> = ({ children }) => {
  const { user, updateUser } = useUser()
  const [isSessionActive, setIsSessionActive] = useState(false)

  const setSessionLength = useCallback(
    (next: number) => {
      updateUser({ userDefaultSessionLength: next })
    },
    [updateUser]
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
