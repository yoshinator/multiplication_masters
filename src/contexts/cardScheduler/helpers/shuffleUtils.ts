// We do a single shuffle when the queue size hits one of these thresholds
export const SHUFFLE_THRESHOLDS = new Set([20, 10, 7, 5, 4, 3])

/**
 * Fisher-Yates shuffle to randomize array in place to create
 * a bit of randomness toward the end of the session
 */
export function shuffleOnce<T>(arr: T[]) {
  // Start from the last element and move backwards
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const randomIndex = Math.floor(Math.random() * (i + 1))

    // Swap arr[i] and arr[randomIndex]
    const temp = arr[i]
    arr[i] = arr[randomIndex]
    arr[randomIndex] = temp
  }
}
