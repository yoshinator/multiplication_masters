import { createContext, useContext } from 'react'
import { noop } from '../../utilities/typeutils'

export type TimerContextValue = {
  time: number
  isRunning: boolean
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
}

export const TimerContext = createContext<TimerContextValue>({
  time: 7000,
  isRunning: false,
  startTimer: noop,
  stopTimer: noop,
  resetTimer: noop,
})

export const useTimerContext = (): TimerContextValue => useContext(TimerContext)
