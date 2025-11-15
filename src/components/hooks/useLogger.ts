export const useLogger = (): ((
  ...args: Parameters<typeof console.log>
) => void) => {
  return (...args: Parameters<typeof console.log>) => {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  }
}
