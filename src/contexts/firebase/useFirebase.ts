import { useContext } from 'react'
import { FirebaseContext } from './firebaseContext'
import type { FirebaseContextValue } from './firebaseContext'

/**
 * React hook to access the Firebase context.
 *
 * Returns the FirebaseContextValue provided by FirebaseContext which exposes the
 * initialized Firebase app, analytics instance (if available), the loaded
 * userCards array and helper functions such as loadUserCards.
 *
 * If the hook is used outside of a FirebaseProvider it returns a safe fallback
 * object (null app/analytics, empty userCards and a no-op loader) to avoid
 * runtime errors in consumers.
 *
 * @returns {FirebaseContextValue} - { app, analytics, userCards, loadUserCards }
 *
 * @example
 * const { app, analytics, userCards, loadUserCards } = useFirebase()
 * // populate userCards for "alice"
 * await loadUserCards('alice')
 */
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
