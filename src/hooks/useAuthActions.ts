import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'
import { useLogger } from './useLogger'

export const useAuthActions = () => {
  const { auth, app } = useFirebaseContext()
  const logger = useLogger('useAuthActions')

  // #region Actions
  const loginAnonymously = async () => {
    if (!auth || !app) {
      throw new Error('Firebase not ready')
    }

    const credential = await signInAnonymously(auth)

    const authUser = credential.user

    const db = getFirestore(app)
    const userRef = doc(db, 'users', authUser.uid)

    // Ensure the user doc always contains uid; other defaults are merged by UserProvider.
    await setDoc(
      userRef,
      { uid: authUser.uid, username: generateRandomUsername() },
      { merge: true }
    )
    return credential
  }

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase not ready')
    return signInWithEmailAndPassword(auth, email, pass)
  }

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase not ready')
    }
    try {
      await auth.signOut()
    } catch (error) {
      logger('Error signing out:', error)
    }
  }
  // #endregion

  return { loginAnonymously, loginWithEmail, signOut }
}

const adjectives = [
  'Quick',
  'Lazy',
  'Happy',
  'Sad',
  'Brave',
  'Clever',
  'Witty',
  'Calm',
  'Eager',
  'Gentle',
]

const animals = [
  'Lion',
  'Tiger',
  'Bear',
  'Wolf',
  'Fox',
  'Eagle',
  'Shark',
  'Panda',
  'Otter',
  'Hawk',
]

export const generateRandomUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const number = Math.floor(Math.random() * 1000)
  return `${adj}${animal}${number}`
}
