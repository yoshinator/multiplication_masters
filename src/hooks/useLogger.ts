import { useCallback, useMemo } from 'react'

export const useLogger = (
  logItem?: string,
  log: boolean = false
): ((...args: Parameters<typeof console.log>) => void) => {
  const prefix = useMemo(() => (logItem ? `[${logItem}] - ` : ''), [logItem])

  return useCallback(
    (...args: Parameters<typeof console.log>) => {
      if (import.meta.env.DEV && log) {
        console.log(prefix, ...args)
      }
    },
    [prefix, log]
  )
}
