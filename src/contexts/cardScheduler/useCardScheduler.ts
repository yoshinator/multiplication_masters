import { useRef, useState, useCallback } from 'react'
import { MinPriorityQueue } from 'datastructures-js'
import type { User, UserCard } from '../../constants/dataModels'
import { BOX_ADVANCE, BOX_STAY, BOX_TIMES } from '../../constants/appConstants'
import { useLogger } from '../../hooks/useLogger'
import { debugQueue } from '../../utilities/debugQueue'
import { useReviewSession } from '../reviewSession/reviewSessionContext'

import {
  computeNewBox,
  estimateReviewLoad,
  percentMastered,
} from './helpers/srsLogic'

import { shuffleOnce, SHUFFLE_THRESHOLDS } from './helpers/shuffleUtils'
import { buildQueue } from './helpers/queueBuilder'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'

// MAIN HOOK: useCardScheduler
export function useCardScheduler(userCards: UserCard[], user: User | null) {
  const logger = useLogger('Scheduler')
  const { addUpdatedCardToSession, finishSession, pendingUserCards } =
    useReviewSession()
  const queueRef = useRef<MinPriorityQueue<UserCard> | null>(null)
  const [currentCard, setCurrentCard] = useState<UserCard | null>(null)
  const [isQueueEmpty, setIsQueueEmpty] = useState(false)
  const [estimatedReviews, setEstimatedReviews] = useState(0)
  const [estimatedUniqueCards, setEstimatedUniqueCards] = useState(0)
  const sessionLengthRef = useRef(30)
  const shuffleCountsRef = useRef(new Set<number>())
  const { setIsSessionActive, sessionLength } = useSessionStatusContext()

  const startSession = useCallback(() => {
    sessionLengthRef.current = sessionLength
    shuffleCountsRef.current = new Set<number>()
    if (!userCards?.length || !user) return
    setIsSessionActive(true)

    logger(`🚀 Starting session. Building queue with size ${sessionLength}`)
    const built = buildQueue(userCards, user, sessionLength, logger)

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
  }, [userCards, user, logger, setIsSessionActive, sessionLength])

  const getNextCard = useCallback(() => {
    const q = queueRef.current
    if (!q) return null

    const next = q.dequeue() ?? null
    setCurrentCard(next)
    setIsQueueEmpty(q.size() === 0)

    logger('➡️ Dequeued next card:', next)
    return next
  }, [logger])

  const submitAnswer = useCallback(
    (card: UserCard, correct: boolean, elapsed: number): UserCard => {
      const now = Date.now()
      const oldBox = card.box
      const newBox = computeNewBox(card, elapsed, correct)

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

      if (newBox <= 3) {
        logger(`🔁 Requeueing learning card`, updated)
        queueRef.current?.enqueue(updated)
      } else {
        logger(`🎉 Card mastered (box>${3}), removing from session`, updated)
      }

      addUpdatedCardToSession(updated, oldBox)

      const q = queueRef.current
      if (q) {
        const size = q.size()

        if (
          SHUFFLE_THRESHOLDS.has(size) &&
          !shuffleCountsRef.current.has(size)
        ) {
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

      const next = getNextCard()
      setCurrentCard(next)
      //TODO: Think of way of decoupling percentage mastered calculation from here
      const allUpdatedCards = userCards.map((c) => pendingUserCards[c.id] || c)
      if (!next && (!q || q.size() === 0)) {
        const percentageMastered =
          (user &&
            percentMastered(allUpdatedCards, user.activeGroup, user.table)) ||
          0

        finishSession(
          'multiplication',
          sessionLengthRef.current,
          percentageMastered
        )
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
