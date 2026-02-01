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

export type PackKey = 'mul_36' | 'mul_144' | 'mul_576'

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

  totalAccuracy: number

  lifetimeCorrect: number
  lifetimeIncorrect: number
  totalSessions: number // Also used in upgrade prompt logic
  userDefaultSessionLength: number

  unlockedScenes?: SceneTheme[]
  activeScene?: SceneTheme
  placedScenes?: {
    [sceneId in SceneTheme]?: SceneObjectInstance[]
  }

  newCardsSeenToday?: number
  lastNewCardDate?: number
  maxNewCardsPerDay?: number

  // Packs
  enabledPacks?: PackKey[] // what they’re allowed to practice
  activePack?: PackKey // what PracticePage uses right now
  metaInitialized?: boolean // server-side init done
  activeSavedSceneId?: string | null
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

export type FactType = 'mul' | 'div' | 'add' | 'sub' | 'square' | 'trig'
export type Difficulty = 'basic' | 'advanced' | 'elite'

export type UserFact = {
  id: string // canonical doc id: "mul:7:8"
  type: FactType
  operands: (number | string)[]
  answer: number | string

  // scope + ordering
  level: number
  difficulty: Difficulty

  // SRS
  box: number
  nextDueTime: number
  lastReviewed: number | null
  wasLastReviewCorrect: boolean
  lastElapsedTime: number
  avgResponseTime: number | null

  // counters
  seen: number
  correct: number
  incorrect: number

  // UI convenience
  expression?: string
}

export type PackMeta = {
  packName: string
  totalFacts: number
  isCompleted: boolean
  nextSeqToIntroduce: number
  lastActivity: number
}

const packFactIdsCache = new Map<PackKey, Set<string>>()

export const getPackFactIds = (packName: PackKey): Set<string> => {
  if (packFactIdsCache.has(packName)) {
    return packFactIdsCache.get(packName)!
  }
  const ids = new Set<string>()
  let max = 0

  if (packName === 'mul_36') max = 6
  else if (packName === 'mul_144') max = 12
  else if (packName === 'mul_576') max = 24
  else return new Set<string>()

  for (let i = 1; i <= max; i++) {
    for (let j = 1; j <= max; j++) {
      ids.add(`mul:${i}:${j}`)
    }
  }

  packFactIdsCache.set(packName, ids)
  return ids
}

export interface SavedScene {
  id: string
  name: string
  theme: SceneTheme
  thumbnailUrl: string
  objects: SceneObjectInstance[]
  backgroundId?: string | null
  createdAt: number
}
