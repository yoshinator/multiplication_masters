import { signInAnonymously } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'

export const useAuthActions = () => {
  const { auth, app } = useFirebaseContext()

  const loginWithUsername = async (username: string) => {
    if (!auth || !app) {
      throw new Error('Firebase not ready')
    }

    const credential = await signInAnonymously(auth)

    const authUser = credential.user

    const db = getFirestore(app)
    const userRef = doc(db, 'users', authUser.uid)

    // Ensure the user doc always contains uid; other defaults are merged by UserProvider.
    await setDoc(userRef, { uid: authUser.uid, username }, { merge: true })
    return credential
  }

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase not ready')
    }
    await auth.signOut()
  }

  return { loginWithUsername, signOut }
}
