import { createContext, useContext } from 'react'
import { noop } from '../../utilities/typeutils'
import { BOX_REGRESS } from '../../constants/appConstants'

export type TimerContextValue = {
  time: number
  isRunning: boolean
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
}

export const TimerContext = createContext<TimerContextValue>({
  time: BOX_REGRESS,
  isRunning: false,
  startTimer: noop,
  stopTimer: noop,
  resetTimer: noop,
})

export const useTimerContext = (): TimerContextValue => useContext(TimerContext)
