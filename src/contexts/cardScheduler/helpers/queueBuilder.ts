import { MinPriorityQueue } from 'datastructures-js'
import type { User, UserCard } from '../../../constants/dataModels'

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
  sessionLength = 3
  if (!user) return null

  const now = Date.now()
  const sessionCards: UserCard[] = []

  let group = 1

  // Loop through ALL groups from 1 → activeGroup
  while (group <= user.activeGroup && sessionCards.length < sessionLength) {
    const groupCards = cards.filter(
      (c) => c.group === group && c.table === user.table
    )

    // 1. Add all DUE cards (ANY box)
    const due = groupCards.filter((c) => c.nextDueTime <= now)
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
    const newCards = groupCards
      .filter((c) => c.seen === 0)
      .slice(0, sessionLength - sessionCards.length)

    sessionCards.push(...newCards)

    if (sessionCards.length >= sessionLength) break

    group++
  }

  /* Build the PQ */
  const queue = new MinPriorityQueue<UserCard>((c) => c.nextDueTime)
  sessionCards.forEach((c) => queue.enqueue(c))

  logger(`📦 Session queue built (${queue.size()} cards):`, sessionCards)

  return { queue, sessionCards }
}
