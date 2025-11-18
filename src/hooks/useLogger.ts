export const useLogger = (
  logItem?: string
): ((...args: Parameters<typeof console.log>) => void) => {
  return (...args: Parameters<typeof console.log>) => {
    if (import.meta.env.DEV) {
      console.log(logItem ? `[${logItem}] - ` : '', ...args)
    }
  }
}
