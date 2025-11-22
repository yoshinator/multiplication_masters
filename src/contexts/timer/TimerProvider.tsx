import { useRef, useState, type FC, type ReactNode, useCallback } from 'react'
import { TimerContext, type TimerContextValue } from './timerContext'
import { TIMER_LENGTH_SECS } from './timerConstants'

interface Props {
  children: ReactNode
}

export const TimerContextProvider: FC<Props> = ({ children }) => {
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const [time, setTime] = useState(TIMER_LENGTH_SECS)
  const [isRunning, setIsRunning] = useState(false)

  const stopTimer = useCallback(() => {
    if (ref.current) {
      clearInterval(ref.current)
      ref.current = null
    }
    setIsRunning(false)
  }, [])

  const startTimer = useCallback(() => {
    if (ref.current) return // already running
    setIsRunning(true)
    ref.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(ref.current!)
          ref.current = null
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const resetTimer = useCallback(() => {
    stopTimer()
    setTime(TIMER_LENGTH_SECS)
  }, [stopTimer])

  const timerContextValues: TimerContextValue = {
    time,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
  }

  return (
    <TimerContext.Provider value={timerContextValues}>
      {children}
    </TimerContext.Provider>
  )
}
