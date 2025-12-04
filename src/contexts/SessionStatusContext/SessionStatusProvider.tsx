import { type FC, type ReactElement, useState } from 'react'
import { SessionStatusContext } from './sessionStatusContext'

interface Props {
  children?: ReactElement
}

const SessionStatusProvider: FC<Props> = ({ children }) => {
  const [isSessionActive, setIsSessionActive] = useState(false)

  return (
    <SessionStatusContext.Provider
      value={{ isSessionActive, setIsSessionActive }}
    >
      {children}
    </SessionStatusContext.Provider>
  )
}

export default SessionStatusProvider
