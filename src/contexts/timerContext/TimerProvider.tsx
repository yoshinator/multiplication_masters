import {
  useRef,
  useState,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { TimerActionsContext, TimerValueContext } from './timerContext'
import { BOX_REGRESS } from '../../constants/appConstants'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'

interface Props {
  children: ReactNode
}

const TimerContextProvider: FC<Props> = ({ children }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const elapsedRef = useRef(0)
  const timeValueRef = useRef(BOX_REGRESS)
  const [timeValue, setTimeValue] = useState<number>(BOX_REGRESS)
  const [isRunning, setIsRunning] = useState(false)
  const { isSessionActive } = useSessionStatusContext()

  const stopTimer = useCallback(() => {
    if (startTimeRef.current) {
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
      timeValueRef.current = remaining
      setTimeValue(remaining)

      if (remaining === 0) {
        // Finalize elapsed exactly once
        elapsedRef.current = BOX_REGRESS

        // Prevent stopTimer from re-accumulating
        startTimeRef.current = null
        stopTimer()
      }
    }, 100)
  }, [stopTimer])

  const resetTimer = useCallback(() => {
    stopTimer()
    elapsedRef.current = 0
    timeValueRef.current = BOX_REGRESS
    setTimeValue(BOX_REGRESS)
  }, [stopTimer])

  const getTime = useCallback(() => {
    let elapsed = elapsedRef.current
    if (startTimeRef.current) {
      elapsed += performance.now() - startTimeRef.current
    }
    return Math.max(BOX_REGRESS - elapsed, 0)
  }, [])

  useEffect(() => {
    if (!isSessionActive) {
      resetTimer()
    }
  }, [isSessionActive, resetTimer, stopTimer])

  const actions = useMemo(
    () => ({
      isRunning,
      startTimer,
      stopTimer,
      resetTimer,
      getTime,
    }),
    [isRunning, startTimer, stopTimer, resetTimer, getTime]
  )

  return (
    <TimerActionsContext.Provider value={actions}>
      <TimerValueContext.Provider value={timeValue}>
        {children}
      </TimerValueContext.Provider>
    </TimerActionsContext.Provider>
  )
}

export default TimerContextProvider
