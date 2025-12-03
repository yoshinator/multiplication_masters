import { createContext, useContext } from 'react'
import type { User } from '../../constants/dataModels'
interface UserContextValue {
  user: User | null
  setUser: (u: User | null) => void
  updateUser: (fields: Partial<User>) => void
}

export const UserContext = createContext<UserContextValue | undefined>(
  undefined
)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
