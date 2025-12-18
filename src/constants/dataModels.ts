/**
 * Data models used in the application
 * This file should only contain type
 * definitions and interfaces related to backend data models.
 * this should help keep a clear separation of concerns and make
 * it easier to manage changes to data structures.
 *
 */

import type { Timestamp } from 'firebase/firestore'
import type { SceneTheme } from './sceneDefinitions'
import type { SceneObjectInstance } from '../components/SceneBuilder/sceneBuilderTypes'

export type UserCard = {
  avgResponseTime: number | null
  bottom: number
  box: number
  correct: number
  correctDivision: number
  difficulty: 'basic' | 'advanced' | 'elite'
  expression: string
  group: number
  id: string
  incorrect: number
  incorrectDivision: number
  isPrimary: boolean
  lastReviewed: number | null
  mirrorOf: string
  nextDueTime: number
  seen: number
  table: number
  top: number
  value: number
  wasLastReviewCorrect: boolean
  wasLastDivisionReviewCorrect: boolean
  lastElapsedTime: number
}

export interface User {
  username: string
  createdAt: Timestamp | null
  lastLogin: Timestamp | null
  subscriptionStatus: 'free' | 'premium'

  activeGroup: number
  table: number
  totalAccuracy: number

  lifetimeCorrect: number
  lifetimeIncorrect: number
  totalSessions: number

  unlockedScenes?: SceneTheme[]
  activeScene?: SceneTheme
  placedScenes?: {
    [sceneId in SceneTheme]?: SceneObjectInstance[]
  }
}

export type SessionRecord = {
  userId: string // username, for convenience

  sessionType: 'multiplication' | 'division' | 'mixed'
  sessionLength: number // 15, 30, 45, or custom

  startedAt: number // timestamp
  endedAt: number // timestamp
  durationMs: number

  correct: number
  incorrect: number
  accuracy: number // calculated %

  avgResponseTime: number | null
  fastCorrect: number
  slowCorrect: number
  timeouts: number

  boxesAdvanced: number
  boxesRegressed: number

  statsByTable: {
    [table: number]: {
      correct: number
      incorrect: number
    }
  }
}
