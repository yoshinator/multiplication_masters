import type { UserCard } from '../../../constants/dataModels'
import {
  BOX_ADVANCE,
  BOX_STAY,
  BOX_REGRESS,
} from '../../../constants/appConstants'

/**
 * Compute new Leitner box
 */
export function computeNewBox(
  card: UserCard,
  elapsed: number,
  correct: boolean
) {
  if (!correct) return 1
  if (elapsed <= BOX_ADVANCE) return card.box + 1
  if (elapsed <= BOX_STAY) return card.box
  if (elapsed <= BOX_REGRESS) return Math.max(1, card.box - 2)
  return 1
}

export function isGroupMastered(
  cards: UserCard[],
  group: number,
  table: number
) {
  const groupCards = cards.filter((c) => c.group === group && c.table === table)
  if (groupCards.length === 0) return false

  // 36 cards per group for 12 table. Level up when 29+ are in box > 3 ~ 80% mastered
  return groupCards.filter((c) => c.box > 3).length > 29
}

export function estimateReviewsForCard(card: UserCard): number {
  const box = card.box ?? 1

  if (box <= 1) return 3 // 1 → 2 → 3 → out
  if (box === 2) return 2 // 2 → 3 → out
  if (box === 3) return 1 // 3 → 4 → out (or stay at 3 once)
  return 1 // 4+ → at most once more this session
}

export function estimateReviewLoad(cards: UserCard[]) {
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
