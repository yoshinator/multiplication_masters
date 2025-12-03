/**
 * Removes undefined fields from an object for firebase updateDoc
 * use on objects passed to updateDoc to avoid silent failures.
 * @param obj - The object to omit undefined fields from
 * @returns A new object with undefined fields removed
 */
export const omitUndefined = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}
