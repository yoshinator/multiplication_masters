import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'
import { useLogger } from './useLogger'
import { useNotification } from '../contexts/notificationContext/NotificationContext'
import { extractErrorMessage } from '../utilities/typeutils'
import { generateRandomUsername } from '../utilities/accountHelpers'

export const useAuthActions = () => {
  const { auth, app } = useFirebaseContext()
  const logger = useLogger('useAuthActions')
  const { showNotification } = useNotification()

  // #region Actions
  const loginAnonymously = async () => {
    try {
      if (!auth || !app) {
        throw new Error('Firebase not ready')
      }

      const credential = await signInAnonymously(auth)

      const authUser = credential.user

      const db = getFirestore(app)

      let username = generateRandomUsername()
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 5) {
        attempts++
        const q = query(
          collection(db, 'users'),
          where('username', '==', username)
        )
        const querySnapshot = await getDocs(q)
        if (querySnapshot.empty) {
          isUnique = true
        } else {
          username = generateRandomUsername()
        }
      }

      if (!isUnique) {
        throw new Error(
          'Unable to generate a unique username. Please try again.'
        )
      }

      const userRef = doc(db, 'users', authUser.uid)

      // Ensure the user doc always contains uid; other defaults are merged by UserProvider.
      await setDoc(userRef, { uid: authUser.uid, username }, { merge: true })
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
      throw error
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
