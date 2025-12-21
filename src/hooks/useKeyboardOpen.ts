import { useEffect, useState } from 'react'
/**
 * Detects keyboard open state based on viewport height changes
 * used for mobile devices when layout shifts due to the keyboard
 * appearing allows components to adjust UI accordingly.
 * This wouldn't be necessary if Safari ~didn't suck~ properly supported visualViewport API
 * @param threshold Height difference threshold to consider keyboard open
 * @returns isOpen Boolean indicating if keyboard is open
 */

export const useKeyboardOpen = (threshold = 120) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!window.visualViewport) return

    const viewport = window.visualViewport
    const initialHeight = viewport.height

    const onResize = () => {
      const heightDiff = initialHeight - viewport.height
      setIsOpen(heightDiff > threshold)
    }

    viewport.addEventListener('resize', onResize)

    return () => {
      viewport.removeEventListener('resize', onResize)
    }
  }, [threshold])

  return isOpen
}
