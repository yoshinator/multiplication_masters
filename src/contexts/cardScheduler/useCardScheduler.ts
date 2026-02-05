import { useRef, useState, useCallback, useEffect } from 'react'
import { MinPriorityQueue } from 'datastructures-js'
import type {
  PackKey,
  PackMeta,
  User,
  UserFact,
} from '../../constants/dataModels'
import { BOX_TIMES } from '../../constants/appConstants'
import { useLogger } from '../../hooks/useLogger'
import { debugQueue } from '../../utilities/debugQueue'
import { useReviewSession } from '../reviewSession/reviewSessionContext'
import { useUser } from '../userContext/useUserContext'

import { computeNewBox, estimateReviewLoad } from './helpers/srsLogic'

import { shuffleOnce, SHUFFLE_THRESHOLDS } from './helpers/shuffleUtils'
import { buildQueue } from './helpers/queueBuilder'
import { useSessionStatusContext } from '../SessionStatusContext/sessionStatusContext'
import { useFirebaseContext } from '../firebase/firebaseContext'
import { extractErrorMessage } from '../../utilities/typeutils'
import { useCloudFunction } from '../../hooks/useCloudFunction'

type CFParams = {
  packName?: PackKey
  count: number
}
// MAIN HOOK: useCardScheduler
export function useCardScheduler(
  userFacts: UserFact[],
  user: User | null,
  activePackMeta: PackMeta | null,
  updateUser: (fields: Partial<User>) => void
) {
  const logger = useLogger('Scheduler')
  const { addUpdatedFactToSession, finishSession } = useReviewSession()
  const { incrementSceneXP } = useUser()
  const queueRef = useRef<MinPriorityQueue<UserFact> | null>(null)
  const [currentFact, setCurrentFact] = useState<UserFact | null>(null)
  const [isQueueEmpty, setIsQueueEmpty] = useState(false)
  const [estimatedReviews, setEstimatedReviews] = useState(0)
  const [estimatedUniqueFacts, setEstimatedUniqueFacts] = useState(0)
  const { setIsSessionActive, sessionLength } = useSessionStatusContext()
  const sessionLengthRef = useRef(sessionLength)
  const shuffleCountsRef = useRef(new Set<number>())
  const hasProvisionedRef = useRef(false)

  const { app } = useFirebaseContext()
  const { execute: provisionFacts, isPending: isProvisioning } =
    useCloudFunction<CFParams, void>('provisionFacts')

  const startSession = useCallback(async () => {
    if (!user || !app) return
    const facts = userFacts ?? []

    const result = buildQueue(
      facts,
      user,
      activePackMeta,
      sessionLength,
      logger
    )
    if (!result) {
      return
    }
    // JIT Trigger: If we couldn't fill the session, call the Cloud Function
    if (result.needsProvisioning) {
      if (!hasProvisionedRef.current) {
        hasProvisionedRef.current = true
        logger('Low card count, provisioning more facts...')
        try {
          await provisionFacts({ packName: user.activePack, count: 12 })
          logger('Provisioning complete.')
          // Stop here. Wait for useEffect to restart us when facts arrive.
          return
        } catch (error) {
          logger('Error provisioning facts:', extractErrorMessage(error))
          hasProvisionedRef.current = false
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
  }, [
    userFacts,
    user,
    logger,
    setIsSessionActive,
    sessionLength,
    activePackMeta,
    app,
    provisionFacts,
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

      if (oldBox < newBox) {
        setEstimatedReviews((prev) => Math.max(0, prev - 1))
      } else if (oldBox > newBox) {
        setEstimatedReviews((prev) => {
          if (oldBox - newBox === 1) {
            return prev + 1
          } else return prev + 2
        })
      }

      const newAvgResponseTime =
        fact.avgResponseTime === null || fact.seen === 0
          ? elapsed
          : (fact.avgResponseTime * fact.seen + elapsed) / (fact.seen + 1)

      const updated: UserFact = {
        ...fact,
        streak: correct ? (fact.streak || 0) + 1 : 0,
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

      if (correct) {
        // Award 2XP if this was a "recovery" correct answer (Bonus Token logic)
        const isBonusRecovery = !fact.wasLastReviewCorrect && fact.seen > 0
        const xpAmount = isBonusRecovery ? 2 : 1
        incrementSceneXP(xpAmount)
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
      incrementSceneXP,
    ]
  )
  const startSessionRef = useRef(startSession)

  /**
   * These two useEffects handle auto-restarting the session after provisioning.
   * I'm using a ref to avoid double starting startSession due to dependency changes.
   * We  normally wouldn't want to run effect to start a session since it should be
   * user initiated but in this case it's justified if the user started the session
   * and we didn't have enough cards.
   * */
  useEffect(() => {
    startSessionRef.current = startSession
  }, [startSession])

  useEffect(() => {
    if (hasProvisionedRef.current && userFacts.length > 0) {
      hasProvisionedRef.current = false
      startSessionRef.current()
    }
  }, [userFacts])

  return {
    currentFact,
    getNextFact,
    submitAnswer,
    startSession,
    isQueueEmpty,
    estimatedReviews,
    estimatedUniqueFacts,
    isLoading: isProvisioning,
  }
}
