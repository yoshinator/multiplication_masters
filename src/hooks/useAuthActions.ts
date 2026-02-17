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
  signInWithCustomToken,
} from 'firebase/auth'
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'
import { useLogger } from './useLogger'
import { useNotification } from '../contexts/notificationContext/notificationContext'
import { extractErrorMessage } from '../utilities/typeutils'
import { useCloudFunction } from './useCloudFunction'
import type { SignInMethod } from '../constants/dataModels'

export const useAuthActions = () => {
  const { auth, app } = useFirebaseContext()
  const logger = useLogger('useAuthActions')
  const { showNotification } = useNotification()

  const { execute: signInWithProfilePinFn } = useCloudFunction<
    { loginName: string; pin: string },
    { customToken: string; profileId?: string }
  >('signInWithProfilePin')

  const { execute: setProfilePinFn } = useCloudFunction<
    { pin: string; profileId?: string },
    { success: true }
  >('setProfilePin')

  const { execute: resetProfilePinLockoutFn } = useCloudFunction<
    { profileId?: string },
    { success: true }
  >('resetProfilePinLockout')

  const setLastSignInMethod = async (uid: string, method: SignInMethod) => {
    try {
      if (!app) return
      const db = getFirestore(app)
      const userRef = doc(db, 'users', uid)
      const tryUpdate = async () => {
        await updateDoc(userRef, { lastSignInMethod: method })
      }

      try {
        await tryUpdate()
      } catch (error: unknown) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code?: unknown }).code)
            : null

        // If the server hasn't created the user doc yet (Auth onCreate), retry once.
        if (code === 'not-found') {
          await new Promise((resolve) => setTimeout(resolve, 750))
          try {
            await tryUpdate()
            return
          } catch (retryError: unknown) {
            const retryCode =
              typeof retryError === 'object' &&
              retryError !== null &&
              'code' in retryError
                ? String((retryError as { code?: unknown }).code)
                : null
            if (retryCode === 'not-found') return
            logger('Error setting lastSignInMethod on retry:', retryError)
            throw retryError
          }
        }

        throw error
      }
    } catch (error: unknown) {
      logger('Error setting lastSignInMethod', error)
      throw error
    }
  }

  // #region Actions
  const loginAnonymously = async () => {
    //Consider moving username generation to cloud function
    try {
      if (!auth || !app) {
        throw new Error('Firebase not ready')
      }

      const credential = await signInAnonymously(auth)

      await setLastSignInMethod(credential.user.uid, 'anonymous')

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
      const credential = await signInWithPopup(auth, provider)
      await setLastSignInMethod(credential.user.uid, 'google')

      return credential
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
      const url = `${window.location.origin}/finish-signin`
      const actionCodeSettings = {
        url,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      const expiry = new Date().getTime() + 3 * 24 * 60 * 60 * 1000 // 3 days
      const item = {
        value: email,
        expiry,
      }
      window.localStorage.setItem('emailForSignIn', JSON.stringify(item))
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
        await setLastSignInMethod(result.user.uid, 'emailLink')

        showNotification('Account upgraded!', 'success')
        return result
      }

      const result = await signInWithEmailLink(auth, email, url)
      await setLastSignInMethod(result.user.uid, 'emailLink')

      showNotification('Successfully signed in!', 'success')
      return result
    } catch (error: unknown) {
      logger('Error finishing email sign in', error)
      showNotification(extractErrorMessage(error), 'error')
      throw error
    }
  }

  const loginWithProfilePin = async (loginName: string, pin: string) => {
    try {
      if (!auth) throw new Error('Firebase not ready')

      const result = await signInWithProfilePinFn({ loginName, pin })
      const customToken = result?.data?.customToken
      if (!customToken) {
        throw new Error('No custom token returned')
      }

      const credential = await signInWithCustomToken(auth, customToken)
      return credential
    } catch (error: unknown) {
      logger('Error logging in with profile PIN', error)
      showNotification(extractErrorMessage(error), 'error')
      throw error
    }
  }

  const setProfilePin = async (pin: string, profileId?: string) => {
    try {
      await setProfilePinFn({ pin, profileId })
    } catch (error: unknown) {
      logger('Error setting profile PIN', error)
      showNotification(extractErrorMessage(error), 'error')
      throw error
    }
  }

  const resetProfilePinLockout = async (profileId?: string) => {
    try {
      await resetProfilePinLockoutFn({ profileId })
    } catch (error: unknown) {
      logger('Error resetting profile PIN lockout', error)
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
    loginWithProfilePin,
    setProfilePin,
    resetProfilePinLockout,
  }
}
