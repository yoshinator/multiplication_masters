import type { FirebaseApp } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import { createContext } from 'react'

export type UserCard = {
  avgResponseTime: number | null
  bottom: number
  correct: number
  difficulty: 'basic' | 'advanced'
  expression: string
  group: number
  id: string
  incorrect: number
  isPrimary: boolean
  lastReviewed: string | null
  mirrorOf: string
  nextDueTime: string | null
  seen: number
  table: number
  top: number
  value: number
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
