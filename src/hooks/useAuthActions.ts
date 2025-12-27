import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'
import { useLogger } from './useLogger'
import { useNotification } from '../contexts/notificationContext/notificationContext'
import { extractErrorMessage } from '../utilities/typeutils'

export const useAuthActions = () => {
  const { auth, app } = useFirebaseContext()
  const logger = useLogger('useAuthActions')
  const { showNotification } = useNotification()

  // #region Actions
  const loginAnonymously = async () => {
    //Consider moving username generation to cloud function
    try {
      if (!auth || !app) {
        throw new Error('Firebase not ready')
      }

      const credential = await signInAnonymously(auth)

      return credential
    } catch (error: unknown) {
      logger('Error logging in anonymously', error)
      showNotification(extractErrorMessage(error), 'error')
      throw error
    }
  }

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      if (!auth) throw new Error('Firebase not ready')
      return await signInWithEmailAndPassword(auth, email, pass)
    } catch (error: unknown) {
      logger('Error logging in with email', error)
      showNotification(extractErrorMessage(error), 'error')
    }
  }

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase not ready')
    }
    try {
      await auth.signOut()
    } catch (error: unknown) {
      logger('Error signing out:', error)
      showNotification(extractErrorMessage(error), 'error')
    }
  }
  // #endregion

  return { loginAnonymously, loginWithEmail, signOut }
}
