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
import type { UserCard } from '../../constants/dataModels'

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
