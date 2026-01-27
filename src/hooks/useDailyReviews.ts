import { useMemo } from 'react'
import { collection, query, where } from 'firebase/firestore'
import { useFirebaseContext } from '../contexts/firebase/firebaseContext'
import { useFirestoreQuery } from './useFirestore'
import type { SessionRecord } from '../constants/dataModels'

export function useDailyReviews(userId?: string) {
  const { db } = useFirebaseContext()

  const dailyQuery = useMemo(() => {
    if (!db || !userId) return null
    // Calculate start of day (Local Time)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    return query(
      collection(db, 'users', userId, 'Sessions'),
      where('endedAt', '>=', startOfDay.getTime())
    )
  }, [db, userId])

  const { data: sessions } = useFirestoreQuery<SessionRecord>(dailyQuery)

  const reviewsToday = sessions.reduce(
    (acc, s) => acc + (s.correct || 0) + (s.incorrect || 0),
    0
  )

  return reviewsToday
}
