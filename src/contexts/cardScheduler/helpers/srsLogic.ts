import { type UserFact, type PackMeta } from '../../../constants/dataModels'
import {
  BOX_ADVANCE,
  BOX_STAY,
  BOX_REGRESS,
} from '../../../constants/appConstants'

/**
 * Compute new Leitner box
 */
export function computeNewBox(
  card: UserFact,
  elapsed: number,
  correct: boolean
) {
  if (!correct) return 1
  if (elapsed <= BOX_ADVANCE) return card.box + 1
  if (elapsed <= BOX_STAY) return card.box
  if (elapsed <= BOX_REGRESS) return Math.max(1, card.box - 2)
  return 1
}

/**
 * Check if a pack is mastered (80%+ of total pack facts are in Box 4+)
 */
export function isPackMastered(
  userFacts: UserFact[],
  meta: PackMeta | null,
  packFactIds: Set<string>
) {
  return percentPackMastered(userFacts, meta, packFactIds) >= 80
}

/**
 * Calculates mastery based on the TOTAL facts in a pack.
 * packFactIds: The PRE-GENERATED Set of IDs for the current pack.
 */
export function percentPackMastered(
  userFacts: UserFact[],
  meta: PackMeta | null,
  packFactIds: Set<string>
): number {
  if (!meta || meta.totalFacts === 0 || !packFactIds || packFactIds.size === 0)
    return 0

  // High-performance filter: .has() on a Set is O(1)
  const masteredInPack = userFacts.filter(
    (f) => packFactIds.has(f.id) && f.box > 3
  ).length

  return Math.round((masteredInPack / meta.totalFacts) * 100)
}

/**
 * Calculates the number of cards in a pack that are due for review today
 * and by tomorrow inclusive of today, returning both metrics as { dueToday, dueTomorrow }.
 */
export function countDueCardsInPack(
  userFacts: UserFact[],
  meta: PackMeta | null,
  packFactIds: Set<string>
) {
  if (!meta || meta.totalFacts === 0 || !packFactIds || packFactIds.size === 0)
    return { dueToday: 0, dueTomorrow: 0 }

  const now = Date.now()
  const dueToday = userFacts.filter(
    (f) => packFactIds.has(f.id) && f.nextDueTime <= now
  ).length

  const tomorrow = Date.now() + 24 * 60 * 60 * 1000 // add 24 hours
  const dueTomorrow = userFacts.filter(
    (f) => packFactIds.has(f.id) && f.nextDueTime <= tomorrow
  ).length

  return { dueToday, dueTomorrow }
}

/**
 * Calculates discovery progress (How much of the pack has been seen at least once)
 */
export function percentPackDiscovered(
  userFacts: UserFact[],
  meta: PackMeta | null,
  packFactIds: Set<string>
): number {
  if (!meta || meta.totalFacts === 0 || !packFactIds || packFactIds.size === 0)
    return 0

  const discoveredInPack = userFacts.filter(
    (f) => packFactIds.has(f.id) && f.seen > 0
  ).length

  return Math.round((discoveredInPack / meta.totalFacts) * 100)
}

/**
 * Simple getter for 'Introduced' percentage based purely on the bookmark
 */
export function percentPackIntroduced(meta: PackMeta | null): number {
  if (!meta || meta.totalFacts === 0) return 0
  return Math.round((meta.nextSeqToIntroduce / meta.totalFacts) * 100)
}

export function estimateReviewsForCard(card: UserFact): number {
  const box = card.box ?? 1
  if (box <= 1) return 3
  if (box === 2) return 2
  if (box === 3) return 1
  return 1
}

export function estimateReviewLoad(cards: UserFact[]) {
  let total = 0
  for (const c of cards) {
    total += estimateReviewsForCard(c)
  }
  return {
    uniqueCards: cards.length,
    estimatedReviews: total,
    averageRepetitions: cards.length ? total / cards.length : 0,
  }
}
