import type { FirebaseApp } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import { createContext } from 'react'

export type UserCard = {
  id: string
  expression: string
  value: number
  lastFail: number | null
  lastPass: number | null
  passCount: number
  failCount: number
  box: number
  createdAt: unknown
}

export type FirebaseContextValue = {
  app: FirebaseApp | null
  analytics: Analytics | null
  userCards: UserCard[]
  loadUserCards: (username: string) => Promise<void>
}

export const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
)

export default FirebaseContext
