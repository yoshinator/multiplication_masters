import { useEffect, useMemo, useRef } from 'react'

type Options = {
  enabled: boolean
  timeoutMs: number
  onTimeout: () => void | Promise<void>
}

export const useInactivityLogout = ({
  enabled,
  timeoutMs,
  onTimeout,
}: Options) => {
  const lastActivityAtRef = useRef<number>(Date.now())
  const timeoutIdRef = useRef<number | null>(null)
  const lastMarkAtRef = useRef<number>(0)

  const events = useMemo(
    () =>
      ['pointerdown', 'keydown', 'scroll', 'mousemove', 'touchstart'] as const,
    []
  )

  useEffect(() => {
    if (!enabled) {
      if (timeoutIdRef.current != null) {
        window.clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      return
    }

    const schedule = () => {
      if (timeoutIdRef.current != null) {
        window.clearTimeout(timeoutIdRef.current)
      }

      const elapsed = Date.now() - lastActivityAtRef.current
      const remaining = timeoutMs - elapsed

      timeoutIdRef.current = window.setTimeout(
        async () => {
          const elapsedNow = Date.now() - lastActivityAtRef.current
          if (elapsedNow >= timeoutMs) {
            await onTimeout()
            return
          }
          schedule()
        },
        Math.max(250, remaining)
      )
    }

    const markActivity = () => {
      const now = Date.now()
      // Throttle very noisy events (e.g. mousemove)
      if (now - lastMarkAtRef.current < 1000) return
      lastMarkAtRef.current = now

      lastActivityAtRef.current = now
      schedule()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsedNow = Date.now() - lastActivityAtRef.current
        if (elapsedNow >= timeoutMs) {
          void onTimeout()
          return
        }
        schedule()
      }
    }

    // initialize
    lastActivityAtRef.current = Date.now()
    schedule()

    for (const evt of events) {
      window.addEventListener(evt, markActivity, { passive: true })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timeoutIdRef.current != null) {
        window.clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      for (const evt of events) {
        window.removeEventListener(evt, markActivity)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, timeoutMs, onTimeout, events])
}
