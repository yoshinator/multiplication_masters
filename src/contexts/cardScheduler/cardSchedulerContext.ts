import { createContext, useContext } from 'react'
import type { UserCard } from '../firebase/firebaseContext'

interface CardSchedulerContextValue {
  startSession: (sessionLength: number) => void
  getNextCard: () => UserCard | null
  submitAnswer: (card: UserCard, correct: boolean, elapsed: number) => void
  endSession: () => void
  currentCard: UserCard | null
  isQueueEmpty: boolean
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
