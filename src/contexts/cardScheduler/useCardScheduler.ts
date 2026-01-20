import { useRef, useState, useCallback } from 'react'
import { httpsCallable, getFunctions } from 'firebase/functions'
import { MinPriorityQueue } from 'datastructures-js'
import type { PackMeta, User, UserFact } from '../../constants/dataModels'
import { BOX_ADVANCE, BOX_STAY, BOX_TIMES } from '../../constants/appConstants'
import { useLogger } from '../../hooks/useLogger'
import { debugQueue } from '../../utilities/debugQueue'
import { useReviewSession } from '../reviewSession/reviewSessionContext'

import { computeNewBox, estimateReviewLoad } from './helpers/srsLogic'

import { shuffleOnce, SHUFFLE_THRESHOLDS } from './helpers/shuffleUtils'
import { buildQueue } from './helpers/queueBuilder'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'
import { useFirebaseContext } from '../firebase/firebaseContext'
import { extractErrorMessage } from '../../utilities/typeutils'

// MAIN HOOK: useCardScheduler
export function useCardScheduler(
  userFacts: UserFact[],
  user: User | null,
  activePackMeta: PackMeta | null,
  updateUser: (fields: Partial<User>) => void
) {
  const logger = useLogger('Scheduler')
  const { addUpdatedFactToSession, finishSession } = useReviewSession()
  const queueRef = useRef<MinPriorityQueue<UserFact> | null>(null)
  const [currentFact, setCurrentFact] = useState<UserFact | null>(null)
  const [isQueueEmpty, setIsQueueEmpty] = useState(false)
  const [estimatedReviews, setEstimatedReviews] = useState(0)
  const [estimatedUniqueFacts, setEstimatedUniqueFacts] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { setIsSessionActive, sessionLength } = useSessionStatusContext()
  const sessionLengthRef = useRef(sessionLength)
  const shuffleCountsRef = useRef(new Set<number>())
  const hasProvisionedRef = useRef(false)

  const { app } = useFirebaseContext()
  const functions = app ? getFunctions(app) : null

  const startSession = useCallback(async () => {
    if (!userFacts || !user || !functions) return

    setIsLoading(true)
    try {
      const result = buildQueue(
        userFacts,
        user,
        activePackMeta,
        sessionLength,
        logger
      )
      if (!result) return
      // JIT Trigger: If we couldn't fill the session, call the Cloud Function
      if (result.needsProvisioning) {
        if (!hasProvisionedRef.current) {
          hasProvisionedRef.current = true
          logger('Low card count, provisioning more facts...')
          try {
            const provisionFacts = httpsCallable(functions, 'provisionFacts')
            await provisionFacts({ packName: user.activePack, count: 12 })
            // The onSnapshot in FirebaseProvider will naturally update userFacts
            // and this effect will re-run or the user can just start with what's there.
          } catch (error) {
            logger('Error provisioning facts:', extractErrorMessage(error))
          }
        } else {
          logger('Provisioning already attempted, skipping to prevent loop.')
        }
      } else {
        hasProvisionedRef.current = false
      }

      setIsSessionActive(true)
      queueRef.current = result.queue

      const estimates = estimateReviewLoad(result.sessionFacts)
      setEstimatedReviews(estimates.estimatedReviews)
      setEstimatedUniqueFacts(estimates.uniqueCards)

      logger('📥 Queue built:', debugQueue(queueRef.current))
      logger('📏 Queue size:', queueRef.current?.size())
      logger('📊 Estimated reviews:', estimates)

      const first = queueRef.current?.dequeue() ?? null
      setCurrentFact(first)
      setIsQueueEmpty((queueRef.current?.size() ?? 0) === 0)

      logger('➡️ First fact:', first)
    } finally {
      setIsLoading(false)
    }
  }, [
    userFacts,
    user,
    logger,
    setIsSessionActive,
    sessionLength,
    activePackMeta,
    functions,
  ])

  const getNextFact = useCallback(() => {
    const q = queueRef.current
    if (!q) return null

    const next = q.dequeue() ?? null
    setCurrentFact(next)
    setIsQueueEmpty(q.size() === 0)

    logger('➡️ Dequeued next fact:', next)
    return next
  }, [logger])

  const submitAnswer = useCallback(
    (fact: UserFact, correct: boolean, elapsed: number): UserFact => {
      const now = Date.now()
      const oldBox = fact.box
      const newBox = computeNewBox(fact, elapsed, correct)

      if (correct && elapsed <= BOX_ADVANCE) {
        setEstimatedReviews((prev) => Math.max(0, prev - 1))
      } else if (correct && elapsed > BOX_STAY) {
        setEstimatedReviews((prev) => prev + 2)
      }

      const newAvgResponseTime =
        fact.avgResponseTime === null || fact.seen === 0
          ? elapsed
          : (fact.avgResponseTime * fact.seen + elapsed) / (fact.seen + 1)

      const updated: UserFact = {
        ...fact,
        box: newBox,
        seen: fact.seen + 1,
        correct: fact.correct + (correct ? 1 : 0),
        incorrect: fact.incorrect + (correct ? 0 : 1),
        nextDueTime: now + BOX_TIMES[newBox - 1],
        wasLastReviewCorrect: correct,
        lastElapsedTime: elapsed,
        lastReviewed: now,
        avgResponseTime: newAvgResponseTime,
      }

      if (fact.seen === 0 && user) {
        const today = new Date(now).toDateString()
        const lastDate = user.lastNewCardDate
          ? new Date(user.lastNewCardDate).toDateString()
          : ''

        const count = lastDate === today ? user.newCardsSeenToday || 0 : 0
        updateUser({
          newCardsSeenToday: count + 1,
          lastNewCardDate: now,
        })
      }

      if (newBox <= 3) {
        logger(`🔁 Requeueing learning fact`, updated)
        queueRef.current?.enqueue(updated)
      } else {
        logger(`🎉 Fact mastered (box>${3}), removing from session`, updated)
      }

      addUpdatedFactToSession(updated, oldBox)

      const q = queueRef.current
      if (q) {
        const size = q.size()

        if (
          SHUFFLE_THRESHOLDS.has(size) &&
          !shuffleCountsRef.current.has(size)
        ) {
          shuffleCountsRef.current.add(size)

          const temp: UserFact[] = []
          while (q.size() > 0) {
            const c = q.dequeue()
            if (c) temp.push(c)
          }

          shuffleOnce(temp)
          temp.forEach((c) => q.enqueue(c))

          logger(`🔀 Queue shuffled at size ${size}`)
        }
      }

      const next = getNextFact()
      setCurrentFact(next)
      if (!next && (!q || q.size() === 0)) {
        finishSession(sessionLengthRef.current)
      }

      return updated
    },
    [
      getNextFact,
      logger,
      addUpdatedFactToSession,
      finishSession,
      user,
      updateUser,
    ]
  )

  return {
    currentFact,
    getNextFact,
    submitAnswer,
    startSession,
    isQueueEmpty,
    estimatedReviews,
    estimatedUniqueFacts,
    isLoading,
  }
}
