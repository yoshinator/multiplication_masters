import { FieldValue } from 'firebase/firestore'

export type FieldValueAllowed<T> = {
  [K in keyof T]?: T[K] | FieldValue
}

export const noop = (): void => {}

/**
 * Extracts a human-readable error message from various error-like values.
 *
 * This utility normalizes different error shapes into a single string message. It supports:
 * - string errors (returns the string as-is),
 * - standard `Error` instances or error-like objects that expose a `message` property, and
 * - objects with a nested `error` property, where `error` can be either a string or
 *   another object with a `message` property.
 *
 * If none of these structures are detected, it falls back to a generic message:
 * `"An unknown error occurred"`.
 *
 * @param error - The unknown error value to extract a message from. This can be a string,
 *   a standard `Error`, an object with a `message` field, or an object containing a nested
 *   `error` field (which may itself be a string or an object with a `message`).
 * @returns A best-effort, human-readable error message describing the error.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error

  if (typeof error === 'object' && error !== null) {
    // 1. Check if 'message' exists directly
    if ('message' in error) {
      const message = (error as { message: unknown }).message
      if (typeof message === 'string') return message
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
        const nestedMessage = (nestedError as { message: unknown }).message
        if (typeof nestedMessage === 'string') return nestedMessage
      }
    }
  }
  return 'An unknown error occurred'
}
