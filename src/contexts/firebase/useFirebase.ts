import { useContext } from 'react'
import { FirebaseContext } from './firebaseContext'
import type { FirebaseContextValue } from './firebaseContext'

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

export default useFirebase
