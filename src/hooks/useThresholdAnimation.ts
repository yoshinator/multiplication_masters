import { useState, useEffect, useRef } from 'react'

export const useThresholdAnimation = (
  value: number,
  threshold: number,
  onThresholdCrossed?: () => void,
  duration: number = 3000
) => {
  const [showAnimation, setShowAnimation] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    const prevValue = prevValueRef.current
    const crossed = prevValue < threshold && value >= threshold
    prevValueRef.current = value

    if (crossed) {
      setShowAnimation(true)
      if (onThresholdCrossed) {
        onThresholdCrossed()
      }
      const timer = setTimeout(() => setShowAnimation(false), duration)
      return () => clearTimeout(timer)
    }
  }, [value, threshold, duration, onThresholdCrossed])

  return showAnimation
}
