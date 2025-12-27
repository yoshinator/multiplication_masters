import { useState, useCallback } from 'react'
import { useThresholdAnimation } from './useThresholdAnimation'

export const useLevelUp = (
  percentageMastered: number,
  threshold: number = 80,
  initialLevel: number = 1
) => {
  const [localLevel, setLocalLevel] = useState(initialLevel)

  const handleLevelUp = useCallback(() => {
    setLocalLevel((prev) => prev + 1)
  }, [])

  const showAnimation = useThresholdAnimation(
    percentageMastered,
    threshold,
    handleLevelUp,
    4500
  )

  return { showAnimation, localLevel }
}
