import {
  signInAnonymously,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth'
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore'
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

  const loginWithGoogle = async () => {
    try {
      if (!auth) throw new Error('Firebase not ready')
      const provider = new GoogleAuthProvider()
      return await signInWithPopup(auth, provider)
    } catch (error: unknown) {
      logger('Error logging in with Google', error)
      showNotification(extractErrorMessage(error), 'error')
    }
  }

  const linkGoogleAccount = async () => {
    try {
      if (!auth || !auth.currentUser) throw new Error('Firebase not ready')
      const provider = new GoogleAuthProvider()
      return await linkWithPopup(auth.currentUser, provider)
    } catch (error: unknown) {
      logger('Error linking Google account', error)
      showNotification(extractErrorMessage(error), 'error')
      throw error
    }
  }

  const snoozeUpgradePrompt = async () => {
    try {
      if (!auth?.currentUser || !app) throw new Error('Not authenticated')
      const db = getFirestore(app)
      const snoozeDate = new Date()
      snoozeDate.setDate(snoozeDate.getDate() + 3)

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        upgradePromptSnoozedUntil: Timestamp.fromDate(snoozeDate),
      })
    } catch (error: unknown) {
      logger('Error snoozing upgrade prompt', error)
    }
  }

  const sendLoginLink = async (email: string) => {
    try {
      if (!auth) throw new Error('Firebase not ready')
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-signin`,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
      showNotification('Link sent! Check your email.', 'success')
    } catch (error: unknown) {
      logger('Error sending login link', error)
      showNotification(extractErrorMessage(error), 'error')
      throw error
    }
  }

  const isEmailLink = (url: string) => {
    if (!auth) return false
    return isSignInWithEmailLink(auth, url)
  }

  /**
   * Finish the email link sign-in process.
   *
   * @param email
   * @param url
   * @returns
   */
  const finishEmailSignIn = async (email: string, url: string) => {
    try {
      if (!auth) throw new Error('Firebase not ready')
      if (auth.currentUser?.isAnonymous) {
        const cred = EmailAuthProvider.credentialWithLink(email, url)
        const result = await linkWithCredential(auth.currentUser, cred)
        showNotification('Account upgraded!', 'success')
        return result
      }

      const result = await signInWithEmailLink(auth, email, url)
      showNotification('Successfully signed in!', 'success')
      return result
    } catch (error: unknown) {
      logger('Error finishing email sign in', error)
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

  return {
    loginAnonymously,
    loginWithEmail,
    signOut,
    loginWithGoogle,
    linkGoogleAccount,
    snoozeUpgradePrompt,
    sendLoginLink,
    isEmailLink,
    finishEmailSignIn,
  }
}
