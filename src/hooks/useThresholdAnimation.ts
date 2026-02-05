import { useState, useEffect, useRef } from 'react'

/**
 * A hook that triggers a temporary boolean state (animation flag) when a numeric value
 * crosses a specified threshold from below.
 *
 * @param value - The current numeric value to monitor (e.g., current XP).
 * @param threshold - The value that triggers the animation when reached or exceeded.
 * @param onThresholdCrossed - Optional callback function to execute when the threshold is crossed.
 * @param duration - How long (in ms) the returned boolean stays true. Defaults to 3000ms.
 * @returns A boolean indicating whether the animation should currently be active.
 */
export const useThresholdAnimation = (
  value: number,
  threshold: number,
  onThresholdCrossed?: (() => void) | null,
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
