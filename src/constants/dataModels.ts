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
  mirrorOf: string | null
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
  uid: string
  username: string
  userRole: 'student' | 'teacher' | 'parent'
  createdAt: Timestamp | null
  lastLogin: Timestamp | null
  subscriptionStatus: 'free' | 'premium'
  showTour: boolean
  upgradePromptCount: number
  lastUpgradePromptAt?: Timestamp
  upgradePromptSnoozedUntil?: Timestamp

  activeGroup: number
  table: number
  totalAccuracy: number

  lifetimeCorrect: number
  lifetimeIncorrect: number
  totalSessions: number // Also used in upgrade prompt logic
  userDefaultSessionLength: number
  currentLevelProgress: number

  unlockedScenes?: SceneTheme[]
  activeScene?: SceneTheme
  placedScenes?: {
    [sceneId in SceneTheme]?: SceneObjectInstance[]
  }

  newCardsSeenToday?: number
  lastNewCardDate?: number
  maxNewCardsPerDay?: number
}

export type SessionRecord = {
  userId: string // uid

  sessionType: 'multiplication' | 'division' | 'mixed'
  sessionLength: number // 10, 20, 30, 45

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

export type Feedback = {
  uid: string
  isAnonymous: boolean
  providers: string[]
  type: 'bug' | 'confusing' | 'feature' | 'pricing' | 'other'

  summary: string
  details: string | null

  // bug-only (nullable for other types)
  stepsToReproduce: string | null
  expected: string | null
  actual: string | null

  canContact: boolean
  contactEmail: string | null

  createdAt: Timestamp
  route: string
  build: string
  env: 'prod' | 'dev'
  viewport: { w: number; h: number }
  userAgent: string
  locale: string
}
