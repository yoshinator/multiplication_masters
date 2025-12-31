import { createContext, useContext } from 'react'
import type { SessionRecord, UserCard } from '../../constants/dataModels'

interface ReviewSessionContextValue {
  correctCount: number
  incorrectCount: number
  addUpdatedCardToSession: (card: UserCard, oldBox: number) => void
  finishSession: (
    sessionLength: number,
    sessionType?: 'multiplication' | 'division' | 'mixed'
  ) => Promise<void>
  latestSession: SessionRecord | null
  pendingUserCards: Record<string, UserCard>
  percentageMastered: number
  isShowingAnswer: boolean
  showAnswer: () => void
  hideAnswer: () => void
  isLoading: boolean
  isSaving: boolean
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
