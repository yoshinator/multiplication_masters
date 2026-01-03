import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from 'react'

interface SessionStatusContextValue {
  isSessionActive: boolean
  setIsSessionActive: Dispatch<SetStateAction<boolean>>
  sessionLength: number
}

export const SessionStatusContext =
  createContext<SessionStatusContextValue | null>(null)

export const useSessionStatusContext = (): SessionStatusContextValue => {
  const ctx = useContext(SessionStatusContext)
  if (!ctx) {
    throw new Error(
      'useSessionStatusContext must be used within a SessionStatusProvider'
    )
  }
  return ctx
}
