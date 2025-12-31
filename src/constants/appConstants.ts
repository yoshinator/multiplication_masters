const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const BOX_TIMES = [
  1 * MIN, // Box 1
  3 * MIN, // Box 2
  15 * MIN, // Box 3
  1 * HOUR, // Box 4
  1 * DAY, // Box 5
  3 * DAY, // Box 6
  7 * DAY, // Box 7
  20 * DAY, // Box 8
  50 * DAY, // Box 9
  120 * DAY, // Box 10 (~4 months)
  365 * DAY, // Box 11 (1 year)
  3 * 365 * DAY, // Box 12 (3 years)
  10 * 365 * DAY, // Box 13 (10 years)
  20 * 365 * DAY, // Box 14 (20 years)
  30 * 365 * DAY, // Box 15 (30 years)
]

export const BOX_ADVANCE = 3000
export const BOX_STAY = 5000
export const BOX_REGRESS = 9000

export const DEFAULT_SESSION_LENGTH = 20
export const FIRST_SESSION_LENGTH = 4

export const MAX_NEW_CARDS_PER_DAY = 20
