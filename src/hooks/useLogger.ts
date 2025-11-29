export const useLogger = (
  logItem?: string,
  log: boolean = false
): ((...args: Parameters<typeof console.log>) => void) => {
  return (...args: Parameters<typeof console.log>) => {
    if (import.meta.env.DEV && log) {
      console.log(logItem ? `[${logItem}] - ` : '', ...args)
    }
  }
}
