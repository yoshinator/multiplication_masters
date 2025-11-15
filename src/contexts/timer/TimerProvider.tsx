import { useRef, useState, type FC, type ReactNode } from 'react'
import { TimerContext, type TimerContextValue } from './timerContext'
import { TIMER_LENGTH_SECS } from './timerConstants'

interface Props {
  children: ReactNode
}

export const TimerContextProvider: FC<Props> = ({ children }) => {
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const [time, setTime] = useState(TIMER_LENGTH_SECS)

  const stopTimer = () => {
    if (ref.current) {
      clearInterval(ref.current)
      ref.current = null
    }
  }

  const startTimer = () => {
    if (ref.current) return
    ref.current = setInterval(() => {
      setTime((prev) => (prev === 0 ? TIMER_LENGTH_SECS : prev - 1))
    }, 1000)
  }

  const timerContextValues: TimerContextValue = {
    time,
    stopTimer,
    startTimer,
    resetTimer: () => {
      stopTimer()
      setTime(TIMER_LENGTH_SECS)
    },
  }

  return (
    <TimerContext.Provider value={timerContextValues}>
      {children}
    </TimerContext.Provider>
  )
}
