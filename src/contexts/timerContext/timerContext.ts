import { createContext, useContext } from 'react'
import { noop } from '../../utilities/typeutils'
import { BOX_REGRESS } from '../../constants/appConstants'

export type TimerActionsContextValue = {
  isRunning: boolean
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  getTime: () => number
}

export const TimerValueContext = createContext<number>(BOX_REGRESS)

export const TimerActionsContext = createContext<TimerActionsContextValue>({
  isRunning: false,
  startTimer: noop,
  stopTimer: noop,
  resetTimer: noop,
  getTime: () => BOX_REGRESS,
})

export const useTimerValue = () => useContext(TimerValueContext)
export const useTimerActions = () => useContext(TimerActionsContext)
