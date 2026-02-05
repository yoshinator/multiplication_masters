import { useState, useEffect, useRef } from 'react'

export const useThresholdAnimation = (
  value: number,
  threshold: number,
  duration: number = 3000,
  onThresholdCrossed?: () => void
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
    }
  }, [value, threshold, onThresholdCrossed])

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), duration)
      return () => clearTimeout(timer)
    }
  }, [showAnimation, duration])

  return showAnimation
}
