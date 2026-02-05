import { createContext, useContext } from 'react'
import type { PackMeta, User, UserSceneMeta } from '../../constants/dataModels'
import type { SceneTheme } from '../../constants/sceneDefinitions'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'
interface UserContextValue {
  user: User | null
  setUser: (u: User | null) => void
  updateUser: (fields: Partial<User>) => void
  authStatus: AuthStatus
  isLoading: boolean
  activePackMeta: PackMeta | null
  activePackFactIds: Set<string>
  activeSceneMeta: UserSceneMeta | null
  incrementSceneXP: (amount?: number) => Promise<void>
  selectScene: (sceneId: SceneTheme) => Promise<void>
}

export const UserContext = createContext<UserContextValue | undefined>(
  undefined
)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
