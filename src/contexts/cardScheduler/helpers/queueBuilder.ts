import { MinPriorityQueue } from 'datastructures-js'
import type { PackMeta, User, UserFact } from '../../../constants/dataModels'
import { MAX_NEW_CARDS_PER_DAY } from '../../../constants/appConstants'

/**
 * Builds a just-in-time review queue based on the user's facts and session length.
 * Prioritizes DUE cards, then LEARNING cards, and finally NEW cards within daily limits.
 *
 *
 * @param userFacts - The array of UserFact objects available to the user.
 * @param user - The User object containing user settings and progress.
 * @param activePackMeta - Metadata about the currently active pack.
 * @param sessionLength - The desired length of the review session.
 * @param logger - A logging function for debug output.
 * @returns An object containing the built queue, session facts, and a flag indicating if provisioning is needed.
 */
export function buildQueue(
  userFacts: UserFact[],
  user: User,
  activePackMeta: PackMeta | null,
  sessionLength: number,
  logger: (...args: unknown[]) => void
) {
  if (!user) return null

  const now = Date.now()
  const sessionFacts: UserFact[] = []

  // 1. Gather all DUE facts the user already owns across ALL packs
  const due = userFacts.filter((f) => f.nextDueTime <= now && f.seen > 0)
  sessionFacts.push(...due)
  // 2. Gather LEARNING facts (Box 1-3) that aren't due yet
  if (sessionFacts.length < sessionLength) {
    const learning = userFacts
      .filter((f) => f.box <= 3 && f.nextDueTime > now)
      .slice(0, sessionLength - sessionFacts.length)
    sessionFacts.push(...learning)
  }

  // 3. Identify NEW facts (seen = 0) already in Firestore
  const dailyLimit = user.maxNewCardsPerDay ?? MAX_NEW_CARDS_PER_DAY

  // Reset count if it's a new day
  const lastDate = user.lastNewCardDate
    ? new Date(user.lastNewCardDate).toDateString()
    : ''
  const today = new Date(now).toDateString()
  const seenToday = lastDate === today ? (user.newCardsSeenToday ?? 0) : 0

  const remainingDaily = Math.max(0, dailyLimit - seenToday)
  let addedNewCount = 0

  if (sessionFacts.length < sessionLength) {
    const newCards = userFacts
      .filter((f) => f.seen === 0)
      .slice(0, Math.min(sessionLength - sessionFacts.length, remainingDaily))

    addedNewCount = newCards.length
    sessionFacts.push(...newCards)
  }

  const queue = new MinPriorityQueue<UserFact>((f) => f.nextDueTime)
  sessionFacts.forEach((f) => queue.enqueue(f))

  logger(`📦 JIT Session queue built (${queue.size()} facts)`)

  return {
    queue,
    sessionFacts,
    needsProvisioning:
      sessionFacts.length < sessionLength &&
      (!activePackMeta || !activePackMeta.isCompleted) &&
      addedNewCount < remainingDaily,
  }
}
