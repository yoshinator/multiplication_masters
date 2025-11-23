import type { FirebaseApp } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Unsubscribe } from 'firebase/firestore'
import { noop } from '../../utilities/typeutils'

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
  loadUserCards: (username: string) => Unsubscribe | void
  setUserCards: Dispatch<SetStateAction<UserCard[]>> | null
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
      loadUserCards: noop,
      setUserCards: noop,
    }
  return ctx
}
