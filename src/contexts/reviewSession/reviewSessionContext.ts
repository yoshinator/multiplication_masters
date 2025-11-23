import { createContext, useContext } from 'react'
import type { UserCard } from '../../constants/dataModels'

interface ReviewSessionContextValue {
  correctCount: number
  incorrectCount: number
  updatedCards: UserCard[]
  addUpdatedCardToSession: (card: UserCard) => void
  flushUpdates: () => Promise<void>
  clearUpdates: () => void
}

export const ReviewSessionContext = createContext<
  ReviewSessionContextValue | undefined
>(undefined)

export function useReviewSession() {
  const ctx = useContext(ReviewSessionContext)
  if (!ctx)
    throw new Error('useReviewSession() must be inside ReviewSessionProvider')
  return ctx
}
