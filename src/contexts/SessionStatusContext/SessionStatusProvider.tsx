import { type FC, type ReactElement, useState } from 'react'
import { SessionStatusContext } from './sessionStatusContext'

interface Props {
  children?: ReactElement
}

// TODO: See about moving percentageMastered here.
const SessionStatusProvider: FC<Props> = ({ children }) => {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionLength, setSessionLength] = useState(15)
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
