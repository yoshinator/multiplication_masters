import {
  useRef,
  useState,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { TimerContext, type TimerContextValue } from './timerContext'
import { BOX_REGRESS } from '../../constants/appConstants'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'

interface Props {
  children: ReactNode
}

const TimerContextProvider: FC<Props> = ({ children }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const elapsedRef = useRef(0)
  const [timeValue, setTimeValue] = useState<number>(BOX_REGRESS)
  const [isRunning, setIsRunning] = useState(false)
  const { isSessionActive } = useSessionStatusContext()

  const stopTimer = useCallback(() => {
    if (intervalRef.current && startTimeRef.current) {
      elapsedRef.current += performance.now() - startTimeRef.current
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    startTimeRef.current = null
    setIsRunning(false)
  }, [])

  const startTimer = useCallback(() => {
    if (intervalRef.current) return

    startTimeRef.current = performance.now()
    setIsRunning(true)

    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return

      const elapsed =
        elapsedRef.current + (performance.now() - startTimeRef.current)

      const remaining = Math.max(BOX_REGRESS - elapsed, 0)
      setTimeValue(remaining)

      if (remaining === 0) {
        // Finalize elapsed exactly once
        elapsedRef.current = BOX_REGRESS

        // Stop without re-accumulating
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        startTimeRef.current = null
        setIsRunning(false)

        setTimeValue(0)
      }
    }, 100)
  }, [stopTimer])

  const resetTimer = useCallback(() => {
    stopTimer()
    elapsedRef.current = 0
    setTimeValue(BOX_REGRESS)
  }, [stopTimer])

  useEffect(() => {
    if (!isSessionActive) {
      resetTimer()
    }
  }, [isSessionActive, resetTimer, stopTimer])

  const timerContextValues: TimerContextValue = {
    time: timeValue,
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

export default TimerContextProvider
