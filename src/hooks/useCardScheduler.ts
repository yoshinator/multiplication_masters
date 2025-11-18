import { useEffect, useRef, useState } from 'react'
import { MinPriorityQueue } from 'datastructures-js'
import type { UserCard } from '../contexts/firebase/firebaseContext'
import { BOX_TIMES } from '../constants/appConstants'
import { type User } from '../components/Login/useLogin'
import { useLogger } from './useLogger'
import { debugQueue } from '../utilities/debugQueue'

/**
 * Build the priority queue based on SRS rules:
 * - Start with group 1
 * - If group has no due cards, load up to 15 new cards
 * - Move to next group only when necessary
 */
function buildQueue(cards: UserCard[], user: User) {
  if (!user) return null
  const now = Date.now()

  const queue = new MinPriorityQueue<UserCard>((card) => card.nextDueTime)

  let selected: UserCard[] = []
  let activeGroup = 1
  while (activeGroup <= user.activeGroup) {
    const groupCards = cards.filter(
      (c) => c.group === activeGroup && c.table === user.table
    )

    // 1. Due cards first
    const due = groupCards.filter((c) => c.nextDueTime <= now)
    if (due.length > 0) {
      selected = due
      break
    }

    // 2. No due → load up to 15 new (unseen) cards
    const newCards = groupCards.filter((c) => c.seen === 0).slice(0, 15)

    if (newCards.length > 0) {
      selected = newCards
      break
    }

    // 3. No due + no new → try next group
    activeGroup++
  }

  // Insert selected cards into the priority queue
  selected.forEach((c) => queue.enqueue(c))

  return queue
}

/**
 * Compute the new box based on timing + correctness
 * SM2 + speed-based Leitner rules:
 * - < 2s → up 1 box
 * - 2–4s → stay
 * - 4–7s → down 2 boxes
 * - incorrect → box = 1
 * - > 7s → box = 1
 * (Note: box min = 1, max = 15)
 * we can make these configurable later
 */
function computeNewBox(card: UserCard, elapsed: number, correct: boolean) {
  if (!correct) return 1

  if (elapsed < 2000) return card.box + 1
  if (elapsed < 4000) return card.box
  if (elapsed < 7000) return Math.max(1, card.box - 2)

  // Very slow = treat like a failure
  return 1
}

/**
 * Main SRS Hook
 *
 * Returns:
 * - currentCard
 * - submitAnswer()
 * - getNextCard()
 * - isQueueEmpty
 */
export function useCardScheduler(userCards: UserCard[], user: User | null) {
  const queueRef = useRef<MinPriorityQueue<UserCard> | null>(null)
  const [currentCard, setCurrentCard] = useState<UserCard | null>(null)
  const [isQueueEmpty, setIsQueueEmpty] = useState(false)
  const logger = useLogger('useCardScheduler')

  //
  // Build the queue when Firebase cards load
  //
  useEffect(() => {
    logger('Checking to build queue...', user)
    if (!userCards || userCards.length === 0 || queueRef.current || !user)
      return

    logger('🧱 Building new queue for user', {
      activeGroup: user.activeGroup,
      table: user.table,
    })
    queueRef.current = buildQueue(userCards, user)

    logger('📥 Queue built with cards:', debugQueue(queueRef?.current))
    logger('📊 Queue size:', queueRef?.current?.size())
    const first = queueRef?.current?.dequeue() ?? null

    logger('➡️ First card dequeued:', first)

    setCurrentCard(first)
    setIsQueueEmpty(!queueRef.current || queueRef.current.size() === 0)
  }, [userCards, user, logger])
  //
  // Return the next card in the queue
  //
  function getNextCard(): UserCard | null {
    const q = queueRef.current
    if (!q) {
      logger('❌ getNextCard called but queue is null')
      return null
    }

    const next = q.dequeue() ?? null

    logger('➡️ getNextCard dequeued:', next)
    logger('📉 Queue size now:', q.size())

    if (!next) {
      logger('⚠️ Queue empty after dequeue — need to refill')
    }

    setCurrentCard(next)
    setIsQueueEmpty(q.size() === 0)
    return next
  }

  //
  // Handle answer submission + compute new SRS scheduling
  // Note: caller should save returned card to Firebase
  //
  function submitAnswer(
    card: UserCard,
    correct: boolean,
    elapsed: number
  ): UserCard {
    const now = Date.now()

    const newBox = computeNewBox(card, elapsed, correct)
    const nextDueTime = now + BOX_TIMES[newBox - 1]

    const updated: UserCard = {
      ...card,
      box: newBox,
      nextDueTime,
      seen: card.seen + 1,
      correct: card.correct + (correct ? 1 : 0),
      incorrect: card.incorrect + (correct ? 0 : 1),
    }

    // Reinsert into the PQ
    queueRef.current?.enqueue(updated)

    logger('📥 Re-queued updated card. Queue size:', queueRef.current?.size())
    logger('📥 Current queue snapshot:', debugQueue(queueRef.current!))

    return updated
  }

  return {
    currentCard,
    getNextCard,
    submitAnswer,
    isQueueEmpty,
    queue: queueRef.current,
  }
}

export default useCardScheduler
