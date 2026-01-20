import { createContext, useContext } from 'react'
import type { PackMeta, User } from '../../constants/dataModels'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'
interface UserContextValue {
  user: User | null
  setUser: (u: User | null) => void
  updateUser: (fields: Partial<User>) => void
  authStatus: AuthStatus
  activePackMeta: PackMeta | null
  activePackFactIds: Set<string>
}

export const UserContext = createContext<UserContextValue | undefined>(
  undefined
)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
