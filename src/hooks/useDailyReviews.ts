import { useState, useEffect } from 'react'
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'

export function useDailyReviews(userId?: string) {
  const { app } = useFirebaseContext()
  const [reviewsToday, setReviewsToday] = useState(0)

  useEffect(() => {
    if (!app || !userId) return

    const db = getFirestore(app)

    // Calculate start of day (Local Time)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const sessionsRef = collection(db, 'users', userId, 'Sessions')

    // Query sessions that ended after the start of today
    const q = query(sessionsRef, where('endedAt', '>=', startOfDay.getTime()))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0
      snapshot.forEach((doc) => {
        const data = doc.data()
        // Sum up correct and incorrect answers for total reviews
        total += (data.correct || 0) + (data.incorrect || 0)
      })
      setReviewsToday(total)
    })

    return () => unsubscribe()
  }, [app, userId])

  return reviewsToday
}
