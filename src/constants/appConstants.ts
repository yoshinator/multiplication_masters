const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/**
 * BOX_TIMES defines the intervals for each box in milliseconds.
 * There are 16 boxes with increasing intervals.
 * Box 1 starts at 1 minute and Box 16 goes up to 30 years.
 * This is the core of the Leitner spaced repetition system.
 * The card scheduler is responsible for moving cards between boxes.
 *
 *
 * We want to keep the initial boxes short for effective learning and
 * to increase the number of cards reviewed in a day if the user
 * doesn't stay on for long periods. Long periods are defined as
 * more than 15 minutes.
 */
export const BOX_TIMES = [
  1 * MIN, // Box 1
  2 * MIN, // Box 2
  4 * MIN, // Box 3
  9 * MIN, // Box 4
  15 * MIN, // Box 5
  1 * HOUR, // Box 6
  1 * DAY, // Box 7
  3 * DAY, // Box 8
  7 * DAY, // Box 9
  21 * DAY, // Box 10
  60 * DAY, // Box 11 (~2 months)
  365 * DAY, // Box 12 (1 year)
  3 * 365 * DAY, // Box 13 (3 years)
  10 * 365 * DAY, // Box 14 (10 years)
  20 * 365 * DAY, // Box 15 (20 years)
  30 * 365 * DAY, // Box 16 (30 years)
]

export const BOX_ADVANCE = 3000
export const BOX_STAY = 5000
export const BOX_REGRESS = 9000

export const DEFAULT_SESSION_LENGTH = 20
export const FIRST_SESSION_LENGTH = 4

export const MAX_NEW_CARDS_PER_DAY = 16
export const NEW_CARDS_PER_DAY_OPTIONS = [8, 16, 24, 32]
