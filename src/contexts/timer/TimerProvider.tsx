import {
  useRef,
  useState,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { TimerContext, type TimerContextValue } from './timerContext'
import { useReviewSession } from '../reviewSession/reviewSessionContext'
import { BOX_REGRESS } from '../../constants/appConstants'

interface Props {
  children: ReactNode
}

const TimerContextProvider: FC<Props> = ({ children }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [timeValue, setTimeValue] = useState<number>(BOX_REGRESS)
  const [isRunning, setIsRunning] = useState(false)
  const { isSessionActive } = useReviewSession()

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const startTimer = useCallback(() => {
    if (intervalRef.current) return // already running
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeValue((prevTime) => {
        if (prevTime <= 100) {
          // Check against 100ms remaining
          stopTimer()
          return 0
        }
        return prevTime - 100
      })
    }, 100)
  }, [stopTimer])

  const resetTimer = useCallback(() => {
    stopTimer()
    // 3. Reset state
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
