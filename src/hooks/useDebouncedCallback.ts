import { useCallback, useEffect, useRef } from 'react'

interface DebouncedCallback<TArgs extends unknown[]> {
  debounced: (...args: TArgs) => void
  cancel: () => void
}

/**
 * Returns a debounced version of a callback plus a cancel function.
 * The debounced function delays invoking `fn` until after `delayMs`
 * has elapsed since the last time it was called.
 */

export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number
): DebouncedCallback<TArgs> {
  const fnRef = useRef(fn)
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const lastArgsRef = useRef<TArgs | null>(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => cancel, [cancel])

  const debounced = useCallback(
    (...args: TArgs) => {
      lastArgsRef.current = args
      cancel()

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        const callArgs = lastArgsRef.current
        if (!callArgs) return
        void fnRef.current(...callArgs)
      }, delayMs)
    },
    [cancel, delayMs]
  )

  return { debounced, cancel }
}
