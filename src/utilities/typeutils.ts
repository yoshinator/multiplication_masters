import { FieldValue } from 'firebase/firestore'

export type FieldValueAllowed<T> = {
  [K in keyof T]?: T[K] | FieldValue
}

export const noop = (): void => {}
