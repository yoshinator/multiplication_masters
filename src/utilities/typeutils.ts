import { FieldValue } from 'firebase/firestore'

export type FieldValueAllowed<T> = {
  [K in keyof T]?: T[K] | FieldValue
}

export const noop = (): void => {}

export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error

  if (typeof error === 'object' && error !== null) {
    // 1. Check if 'message' exists directly
    if ('message' in error) {
      return String((error as { message: string }).message)
    }
    // 2. Check if 'error' property exists (nested error)
    if ('error' in error) {
      const nestedError = (error as { error: unknown }).error
      if (typeof nestedError === 'string') return nestedError
      if (
        typeof nestedError === 'object' &&
        nestedError !== null &&
        'message' in nestedError
      ) {
        return String(nestedError.message)
      }
    }
  }
  return 'An unknown error occurred'
}
