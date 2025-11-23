import { useContext } from 'react'
import { FirebaseContext } from './firebase/firebaseContext'
import type { FirebaseContextValue } from './firebase/firebaseContext'

export const useFirebase = (): FirebaseContextValue => {
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
