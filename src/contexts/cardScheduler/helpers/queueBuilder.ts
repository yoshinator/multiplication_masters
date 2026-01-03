import { MinPriorityQueue } from 'datastructures-js'
import type { User, UserCard } from '../../../constants/dataModels'
import { MAX_NEW_CARDS_PER_DAY } from '../../../constants/appConstants'

/**
 * Build the initial session queue
 * Rules:
 *  - First: load all due cards (box ≥ 1 AND nextDue ≤ now)
 *  - If no due cards: load up to 35 new cards (seen = 0)
 *  - If neither exist: increment activeGroup until one of the above is true
 */
export function buildQueue(
  cards: UserCard[],
  user: User,
  sessionLength: number,
  logger: (...args: unknown[]) => void
) {
  if (!user) return null

  const now = Date.now()
  const MAX_NEW_CARDS_TODAY = user.maxNewCardsPerDay ?? MAX_NEW_CARDS_PER_DAY

  let newCardsSeenToday = 0
  if (user.lastNewCardDate) {
    const last = new Date(user.lastNewCardDate)
    const today = new Date(now)
    if (last.toDateString() === today.toDateString()) {
      newCardsSeenToday = user.newCardsSeenToday || 0
    }
  }

  let newCardsAddedThisSession = 0
  const sessionCards: UserCard[] = []

  let group = 1

  // Loop through ALL groups from 1 → activeGroup
  while (group <= user.activeGroup && sessionCards.length < sessionLength) {
    const groupCards = cards.filter(
      (c) => c.group === group && c.table === user.table
    )

    // 1. Add all DUE cards (ANY box). If not seen yet, they are new. Seen variable is a lifetime counter
    const due = groupCards.filter((c) => c.nextDueTime <= now && c.seen > 0)
    for (const d of due) {
      if (sessionCards.length < sessionLength) {
        sessionCards.push(d)
      }
    }

    if (sessionCards.length >= sessionLength) break

    // 2. Add learning cards (box <= 3, not due)
    const learning = groupCards
      .filter((c) => c.box <= 3 && c.nextDueTime > now)
      .slice(0, sessionLength - sessionCards.length)

    sessionCards.push(...learning)

    if (sessionCards.length >= sessionLength) break

    // 3. Add NEW cards (seen = 0)
    const remainingDailyLimit = Math.max(
      0,
      MAX_NEW_CARDS_TODAY - newCardsSeenToday - newCardsAddedThisSession
    )
    const slotsAvailable = sessionLength - sessionCards.length
    const newCards = groupCards
      .filter((c) => c.seen === 0)
      .slice(0, Math.min(slotsAvailable, remainingDailyLimit))

    sessionCards.push(...newCards)
    newCardsAddedThisSession += newCards.length

    if (sessionCards.length >= sessionLength) break

    group++
  }

  /* Build the PQ */
  const queue = new MinPriorityQueue<UserCard>((c) => c.nextDueTime)
  sessionCards.forEach((c) => queue.enqueue(c))

  logger(`📦 Session queue built (${queue.size()} cards):`, sessionCards)

  return { queue, sessionCards }
}
