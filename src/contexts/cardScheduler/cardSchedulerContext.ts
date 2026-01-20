import { createContext, useContext } from 'react'
import type { UserFact } from '../../constants/dataModels'

interface CardSchedulerContextValue {
  currentFact: UserFact | null
  getNextFact: () => UserFact | null
  submitAnswer: (fact: UserFact, correct: boolean, elapsed: number) => UserFact
  startSession: () => Promise<void>
  isQueueEmpty: boolean
  estimatedReviews: number
  estimatedUniqueFacts: number
  isLoading: boolean
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
