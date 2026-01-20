import { createContext, useContext } from 'react'
import type { SessionRecord, UserFact } from '../../constants/dataModels'

interface ReviewSessionContextValue {
  correctCount: number
  incorrectCount: number
  addUpdatedFactToSession: (fact: UserFact, oldBox: number) => void
  finishSession: (
    sessionLength: number,
    sessionType?: 'multiplication' | 'division' | 'mixed'
  ) => Promise<void>
  latestSession: SessionRecord | null
  pendingUserFacts: Record<string, UserFact>
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
