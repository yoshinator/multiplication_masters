import type { GradeLevel, PackKey } from './dataModels'

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

export const MAX_NEW_CARDS_PER_DAY = 10
export const NEW_CARDS_PER_DAY_OPTIONS = [5, 10, 15, 30]

export const MASTERY_BOX_THRESHOLD = 9 // Boxes 9 and above are considered mastered. Days until next review is 7 days or more.

// PACKS
export const MUL_36 = 'mul_36'
export const MUL_144 = 'mul_144'
export const MUL_576 = 'mul_576'
export const DIV_144 = 'div_144'
export const MUL_DIV_144 = 'mul_div_144'
export const ADD_20 = 'add_20'
export const SUB_20 = 'sub_20'

export const ALL_PACKS: PackKey[] = [
  MUL_36,
  MUL_144,
  MUL_576,
  DIV_144,
  MUL_DIV_144,
  ADD_20,
  SUB_20,
]

export const PACK_LABELS: Record<PackKey, string> = {
  [MUL_36]: 'Multiplication up to 6',
  [MUL_144]: 'Multiplication up to 12',
  [MUL_576]: 'Multiplication up to 24',
  [DIV_144]: 'Division up to 12',
  [MUL_DIV_144]: 'Multiplication & Division up to 12',
  [ADD_20]: 'Addition within 20',
  [SUB_20]: 'Subtraction within 20',
}

// Packs that are available to free users. The rest are for premium users.
export const FREE_PACKS: PackKey[] = [MUL_36, ADD_20, SUB_20]

export const CLASS_GRADE_OPTIONS: Array<{ value: GradeLevel; label: string }> =
  [
    { value: 'K', label: 'K' },
    { value: '1', label: '1st' },
    { value: '2', label: '2nd' },
    { value: '3', label: '3rd' },
    { value: '4', label: '4th' },
    { value: '5', label: '5th' },
    { value: '6', label: '6th' },
    { value: '7', label: '7th' },
    { value: '8', label: '8th' },
    { value: '9+', label: '9+' },
  ]
