import type { FirebaseApp } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import { createContext, useContext } from 'react'

export type UserCard = {
  avgResponseTime: number | null
  bottom: number
  box: number
  correct: number
  difficulty: 'basic' | 'advanced'
  expression: string
  group: number
  id: string
  incorrect: number
  isPrimary: boolean
  lastReviewed: number | null
  mirrorOf: string
  nextDueTime: number
  seen: number
  table: number
  top: number
  value: number
  wasLastReviewCorrect: boolean
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

export const useFirebaseContext = (): FirebaseContextValue => {
  const ctx = useContext(FirebaseContext)
  if (!ctx)
    return {
      app: null,
      analytics: null,
      userCards: [],
      loadUserCards: async () => {},
    }
  return ctx
}
