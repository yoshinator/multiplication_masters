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
  duration: number = 3000,
  options?: {
    /**
     * When false, the hook will not trigger animations and will keep its
     * internal previous value in sync with `value`.
     */
    enabled?: boolean
    /**
     * If true (default), when `enabled` flips from false -> true the hook will
     * reset its previous value to the current `value` to avoid firing due to
     * initial hydration/network loads.
     */
    resetOnEnable?: boolean
  }
) => {
  const [showAnimation, setShowAnimation] = useState(false)
  const prevValueRef = useRef(value)
  const prevEnabledRef = useRef(options?.enabled ?? true)

  useEffect(() => {
    const enabled = options?.enabled ?? true
    const resetOnEnable = options?.resetOnEnable ?? true

    // Keep internal state in sync while disabled.
    if (!enabled) {
      prevValueRef.current = value
      prevEnabledRef.current = false
      return
    }

    // Avoid firing when we just became enabled (common on first data load).
    if (!prevEnabledRef.current && resetOnEnable) {
      prevValueRef.current = value
      prevEnabledRef.current = true
      return
    }

    const prevValue = prevValueRef.current
    const crossed = prevValue < threshold && value >= threshold
    prevValueRef.current = value
    prevEnabledRef.current = true

    if (crossed) {
      setShowAnimation(true)
      if (onThresholdCrossed) {
        onThresholdCrossed()
      }
    }
  }, [
    value,
    threshold,
    onThresholdCrossed,
    options?.enabled,
    options?.resetOnEnable,
  ])

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), duration)
      return () => clearTimeout(timer)
    }
  }, [showAnimation, duration])

  return showAnimation
}
