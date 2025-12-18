import { createContext, useContext } from 'react'
import type { UserCard } from '../../constants/dataModels'

interface CardSchedulerContextValue {
  startSession: () => void
  getNextCard: () => UserCard | null
  submitAnswer: (card: UserCard, correct: boolean, elapsed: number) => void
  currentCard: UserCard | null
  isQueueEmpty: boolean
  estimatedReviews: number
  estimatedUniqueCards: number
}

export const CardSchedulerContext =
  createContext<CardSchedulerContextValue | null>(null)

export const useCardSchedulerContext = (): CardSchedulerContextValue => {
  const ctx = useContext(CardSchedulerContext)
  if (!ctx) {
    throw new Error(
      'useCardSchedulerContext must be used within a CardSchedulerProvider'
    )
  }
  return ctx
}
