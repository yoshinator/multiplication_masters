import { useRef, useState, useCallback } from 'react'
import { MinPriorityQueue } from 'datastructures-js'
import type { User, UserCard } from '../../constants/dataModels'
import { BOX_TIMES } from '../../constants/appConstants'
import { useLogger } from '../../hooks/useLogger'
import { debugQueue } from '../../utilities/debugQueue'
import { useReviewSession } from '../reviewSession/reviewSessionContext'

// ALL SCHEDULING LOGIC

/**
 * Compute new Leitner box
 */
function computeNewBox(card: UserCard, elapsed: number, correct: boolean) {
  if (!correct) return 1
  if (elapsed < 2000) return card.box + 1
  if (elapsed < 4000) return card.box
  if (elapsed < 7000) return Math.max(1, card.box - 2)
  return 1
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

  return queue
}

// MAIN HOOK: useCardScheduler
export function useCardScheduler(userCards: UserCard[], user: User | null) {
  const logger = useLogger('Scheduler')
  const { addUpdatedCardToSession, finishSession } = useReviewSession()
  const queueRef = useRef<MinPriorityQueue<UserCard> | null>(null)
  const [currentCard, setCurrentCard] = useState<UserCard | null>(null)
  const [isQueueEmpty, setIsQueueEmpty] = useState(false)
  const sessionLengthRef = useRef(30)

  // Build a new session queue
  const startSession = useCallback(
    (userSessionLength: number) => {
      sessionLengthRef.current = userSessionLength
      if (!userCards?.length || !user) return

      logger(
        `🚀 Starting session. Building queue with size ${userSessionLength}`
      )
      queueRef.current = buildQueue(userCards, user, userSessionLength, logger)

      logger('📥 Queue built:', debugQueue(queueRef.current))
      logger('📏 Queue size:', queueRef.current?.size())

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

  const endSession = useCallback(() => {
    logger(`🛑 Ending session. Queue flushed.`)
    queueRef.current = null
    setCurrentCard(null)
    setIsQueueEmpty(true)
    finishSession('multiplication', sessionLengthRef.current)
  }, [finishSession, logger])

  // Handle answer submission
  const submitAnswer = useCallback(
    (card: UserCard, correct: boolean, elapsed: number): UserCard => {
      const now = Date.now()
      const oldBox = card.box
      const newBox = computeNewBox(card, elapsed, correct)

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

      // Requeue only if still “learning”
      if (newBox <= 3) {
        logger(`🔁 Requeueing card (box=${newBox})`, updated)
        queueRef.current?.enqueue(updated)
      } else {
        logger(`🎉 Card reached box ${newBox}. Removing from session.`)
      }

      addUpdatedCardToSession(updated, oldBox)

      const next = getNextCard()
      setCurrentCard(next)

      // 4. Only end session if truly empty
      const q = queueRef.current
      if (!next && (!q || q.size() === 0)) {
        endSession()
      }

      return updated
    },
    [getNextCard, logger, addUpdatedCardToSession, endSession]
  )

  return {
    currentCard,
    getNextCard,
    submitAnswer,
    startSession,
    endSession,
    isQueueEmpty,
  }
}
