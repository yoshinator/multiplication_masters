import type { FirebaseApp } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import type { Auth } from 'firebase/auth'
import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Unsubscribe } from 'firebase/firestore'
import { noop } from '../../utilities/typeutils'
import type { UserCard } from '../../constants/dataModels'

export type FirebaseContextValue = {
  app: FirebaseApp | null
  auth: Auth | null
  analytics: Analytics | null
  userCards: UserCard[]
  loadUserCards: (uid: string) => Unsubscribe
  ensureUserCards: (uid: string) => Promise<void>
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
      auth: null,
      analytics: null,
      userCards: [],
      loadUserCards: () => noop as Unsubscribe,
      ensureUserCards: async () => {},
      setUserCards: null,
    }
  return ctx
}
