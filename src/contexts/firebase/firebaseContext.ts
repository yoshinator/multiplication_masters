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
import type { UserFact } from '../../constants/dataModels'
import type { FirebaseStorage } from 'firebase/storage'
import type { Firestore } from 'firebase/firestore'

export type FirebaseContextValue = {
  app: FirebaseApp | null
  auth: Auth | null
  analytics: Analytics | null
  db: Firestore | null
  userFacts: UserFact[]
  storage: FirebaseStorage | null
  loadUserFacts: (uid?: string) => Unsubscribe
  setUserFacts: Dispatch<SetStateAction<UserFact[]>> | null
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
      db: null,
      userFacts: [],
      storage: null,
      loadUserFacts() {
        return noop as Unsubscribe
      },
      setUserFacts: null,
    }
  return ctx
}
