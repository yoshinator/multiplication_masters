import { type FC, type ReactElement, useCallback, useState } from 'react'
import { SessionStatusContext } from './sessionStatusContext'

import { useUser } from '../userContext/useUserContext'

interface Props {
  children?: ReactElement
}

// TODO: See about moving percentageMastered here.
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
        sessionLength: user?.userDefaultSessionLength ?? 15,
        setSessionLength,
      }}
    >
      {children}
    </SessionStatusContext.Provider>
  )
}

export default SessionStatusProvider
