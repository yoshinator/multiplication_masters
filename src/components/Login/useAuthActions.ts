import { signInAnonymously } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'

export const useAuthActions = () => {
  const { auth, app } = useFirebaseContext()

  const loginWithUsername = async (username: string) => {
    if (!auth || !app) {
      throw new Error('Firebase not ready')
    }

    const cred = await signInAnonymously(auth)

    const db = getFirestore(app)
    const userRef = doc(db, 'users', cred.user.uid)

    await setDoc(userRef, { username }, { merge: true })
  }

  return { loginWithUsername }
}
