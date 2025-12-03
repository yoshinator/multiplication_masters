import { FieldValue } from 'firebase/firestore' // Import needed FieldValue type

export type FieldValueAllowed<T> = {
  [K in keyof T]?: T[K] | FieldValue
}

export const noop = (): void => {}
