import { useRef, useState, useCallback } from 'react'
import { MinPriorityQueue } from 'datastructures-js'
import type { User, UserCard } from '../../constants/dataModels'
import {
  BOX_ADVANCE,
  BOX_STAY,
  BOX_REGRESS,
  BOX_TIMES,
} from '../../constants/appConstants'
import { useLogger } from '../../hooks/useLogger'
import { debugQueue } from '../../utilities/debugQueue'
import { useReviewSession } from '../reviewSession/reviewSessionContext'

// We do a single shuffle when the queue size hits one of these thresholds
const SHUFFLE_THRESHOLDS = new Set([20, 10, 7, 5, 4, 3])

// ALL SCHEDULING LOGIC

/**
 * Compute new Leitner box
 */
function computeNewBox(card: UserCard, elapsed: number, correct: boolean) {
  if (!correct) return 1
  if (elapsed <= BOX_ADVANCE) return card.box + 1
  if (elapsed <= BOX_STAY) return card.box
  if (elapsed <= BOX_REGRESS) return Math.max(1, card.box - 2)
  return 1
}

function isGroupMastered(cards: UserCard[], group: number, table: number) {
  const groupCards = cards.filter((c) => c.group === group && c.table === table)
  if (groupCards.length === 0) return false

  // 36 cards per group for 12 table. Level up when 29+ are in box > 3 ~ 80% mastered
  return groupCards.filter((c) => c.box > 3).length > 29
}

function estimateReviewsForCard(card: UserCard): number {
  const box = card.box ?? 1

  if (box <= 1) return 3 // 1 → 2 → 3 → out
  if (box === 2) return 2 // 2 → 3 → out
  if (box === 3) return 1 // 3 → 4 → out (or stay at 3 once)
  return 1 // 4+ → at most once more this session
}

function estimateReviewLoad(cards: UserCard[]) {
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

/**
 * Fisher-Yates shuffle to randomize array in place to create
 * a bit of randomness toward the end of the session
 */
function shuffleOnce<T>(arr: T[]) {
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

/**
 * Build the initial session queue
 * Rules:
 *  - First: load all due cards (box ≥ 1 AND nextDue ≤ now)
 *  - If no due cards: load up to 35 new cards (seen = 0)
 *  - If neither exist: increment activeGroup until one of the above is true
 */
function buildQueue(
  cards: UserCard[],
  user: User,
  sessionLength: number,
  logger: ReturnType<typeof useLogger>
) {
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

    // move to next group
    group++
  }

  /* Build the PQ */
  const queue = new MinPriorityQueue<UserCard>((c) => c.nextDueTime)
  sessionCards.forEach((c) => queue.enqueue(c))

  logger(`📦 Session queue built (${queue.size()} cards):`, sessionCards)

  return { queue, sessionCards }
}

// MAIN HOOK: useCardScheduler
export function useCardScheduler(userCards: UserCard[], user: User | null) {
  const logger = useLogger('Scheduler', true)
  const { addUpdatedCardToSession, finishSession, pendingUserCards } =
    useReviewSession()
  const queueRef = useRef<MinPriorityQueue<UserCard> | null>(null)
  const [currentCard, setCurrentCard] = useState<UserCard | null>(null)
  const [isQueueEmpty, setIsQueueEmpty] = useState(false)
  const [estimatedReviews, setEstimatedReviews] = useState(0)
  const [estimatedUniqueCards, setEstimatedUniqueCards] = useState(0)
  const sessionLengthRef = useRef(30)
  const shuffleCountsRef = useRef(new Set<number>())

  const startSession = useCallback(
    (userSessionLength: number) => {
      sessionLengthRef.current = userSessionLength
      shuffleCountsRef.current = new Set<number>()
      if (!userCards?.length || !user) return

      logger(
        `🚀 Starting session. Building queue with size ${userSessionLength}`
      )
      const built = buildQueue(userCards, user, userSessionLength, logger)

      if (!built) return

      queueRef.current = built.queue

      const estimates = estimateReviewLoad(built.sessionCards)
      setEstimatedReviews(estimates.estimatedReviews)
      setEstimatedUniqueCards(estimates.uniqueCards)

      logger('📥 Queue built:', debugQueue(queueRef.current))
      logger('📏 Queue size:', queueRef.current?.size())
      logger('📊 Estimated reviews:', estimates)

      const first = queueRef.current?.dequeue() ?? null
      setCurrentCard(first)
      setIsQueueEmpty((queueRef.current?.size() ?? 0) === 0)

      logger('➡️ First card:', first)
    },
    [userCards, user, logger]
  )

  //Return next card
  const getNextCard = useCallback(() => {
    const q = queueRef.current
    if (!q) return null

    const next = q.dequeue() ?? null
    setCurrentCard(next)
    setIsQueueEmpty(q.size() === 0)

    logger('➡️ Dequeued next card:', next)
    return next
  }, [logger])

  // Handle answer submission
  const submitAnswer = useCallback(
    (card: UserCard, correct: boolean, elapsed: number): UserCard => {
      const now = Date.now()
      const oldBox = card.box
      const newBox = computeNewBox(card, elapsed, correct)

      // Update estimated reviews based on answer outcome
      if (correct && elapsed <= BOX_ADVANCE) {
        setEstimatedReviews((prev) => Math.max(0, prev - 1))
      } else if (correct && elapsed > BOX_STAY) {
        setEstimatedReviews((prev) => prev + 2)
      }

      const updated: UserCard = {
        ...card,
        box: newBox,
        seen: card.seen + 1,
        correct: card.correct + (correct ? 1 : 0),
        incorrect: card.incorrect + (correct ? 0 : 1),
        nextDueTime: now + BOX_TIMES[newBox - 1],
        wasLastReviewCorrect: correct,
        lastElapsedTime: elapsed,
        lastReviewed: now,
      }

      // Requeue only if the card is still "learning"
      if (newBox <= 3) {
        logger(`🔁 Requeueing learning card`, updated)
        queueRef.current?.enqueue(updated)
      } else {
        logger(`🎉 Card mastered (box>${3}), removing from session`, updated)
      }

      // Track session stats + update local card state
      addUpdatedCardToSession(updated, oldBox)

      const q = queueRef.current
      if (q) {
        const size = q.size()

        // Check if this size is a shuffle trigger AND we haven't shuffled at this size yet
        if (
          SHUFFLE_THRESHOLDS.has(size) &&
          !shuffleCountsRef.current.has(size)
        ) {
          // record that we shuffled here, this prevents double shuffles at same size
          shuffleCountsRef.current.add(size)

          const temp: UserCard[] = []

          while (q.size() > 0) {
            const c = q.dequeue()
            if (c) temp.push(c)
          }

          shuffleOnce(temp)

          temp.forEach((c) => q.enqueue(c))

          logger(`🔀 Queue shuffled at size ${size}`)
        }
      }

      // Pull next card
      const next = getNextCard()
      setCurrentCard(next)

      // Build updated card set for mastery check
      const allUpdatedCards = userCards.map((c) => pendingUserCards[c.id] || c)

      // End session only when there truly are no more cards to show
      if (!next && (!q || q.size() === 0)) {
        const mastered = user
          ? isGroupMastered(allUpdatedCards, user.activeGroup, user.table)
          : false

        finishSession('multiplication', sessionLengthRef.current, mastered)
      }

      return updated
    },
    [
      getNextCard,
      logger,
      addUpdatedCardToSession,
      finishSession,
      pendingUserCards,
      user,
      userCards,
    ]
  )

  return {
    currentCard,
    getNextCard,
    submitAnswer,
    startSession,
    isQueueEmpty,
    estimatedReviews,
    estimatedUniqueCards,
  }
}
