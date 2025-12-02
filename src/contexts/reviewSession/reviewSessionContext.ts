import { createContext, useContext } from 'react'
import type { SessionRecord, UserCard } from '../../constants/dataModels'

interface ReviewSessionContextValue {
  correctCount: number
  incorrectCount: number
  addUpdatedCardToSession: (card: UserCard, oldBox: number) => void
  finishSession: (
    sessionType: 'multiplication' | 'division' | 'mixed',
    sessionLength: number,
    mastered: boolean
  ) => Promise<void>
  isSessionActive: boolean
  latestSession: SessionRecord | null
  pendingUserCards: Record<string, UserCard>
  isMastered: boolean
  isShowingAnswer: boolean
  showAnswer: () => void
  hideAnswer: () => void
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
