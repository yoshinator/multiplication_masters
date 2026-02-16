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

export type PackKey =
  | 'mul_36'
  | 'mul_144'
  | 'mul_576'
  | 'div_144'
  | 'add_20'
  | 'sub_20'

export type SignInMethod = 'anonymous' | 'google' | 'emailLink' | 'profilePin'
export type UserRole = 'student' | 'teacher' | 'parent' | 'adult'
export type GradeLevel =
  | 'K'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9+'
  | 'adult'

export interface User {
  uid: string
  username: string
  lastSignInMethod?: SignInMethod
  userRole: UserRole
  createdAt: Timestamp | null
  lastLogin: Timestamp | null
  subscriptionStatus: 'free' | 'premium'
  activeProfileId?: string
  showTour: boolean
  onboardingCompleted?: boolean
  upgradePromptCount: number
  lastUpgradePromptAt?: Timestamp
  upgradePromptSnoozedUntil?: Timestamp
  learnerGradeLevels?: GradeLevel[]
  learnerCount?: number

  totalAccuracy: number

  lifetimeCorrect: number
  lifetimeIncorrect: number
  totalSessions: number // Also used in upgrade prompt logic
  userDefaultSessionLength: number

  unlockedScenes?: SceneTheme[]
  activeScene?: SceneTheme
  newCardsSeenToday?: number
  lastNewCardDate?: number
  maxNewCardsPerDay?: number

  // Packs
  enabledPacks?: PackKey[] // what they’re allowed to practice
  activePack?: PackKey // what PracticePage uses right now
  metaInitialized?: boolean // server-side init done
  activeSavedSceneId?: string | null
}

export interface UserAccount {
  uid: string
  userRole: UserRole
  subscriptionStatus: 'free' | 'premium'
  lastSignInMethod?: SignInMethod
  createdAt: Timestamp | null
  lastLogin: Timestamp | null
  activeProfileId?: string
}

export type UserProfile = {
  id: string
  displayName: string
  loginName: string
  gradeLevel: number | null
  pinEnabled?: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null

  showTour?: boolean
  onboardingCompleted?: boolean
  learnerGradeLevels?: GradeLevel[]
  learnerCount?: number
  upgradePromptCount?: number

  totalAccuracy?: number
  lifetimeCorrect?: number
  lifetimeIncorrect?: number
  totalSessions?: number
  userDefaultSessionLength?: number

  unlockedScenes?: SceneTheme[]
  activeScene?: SceneTheme
  newCardsSeenToday?: number
  lastNewCardDate?: number
  maxNewCardsPerDay?: number

  enabledPacks?: PackKey[]
  activePack?: PackKey
  metaInitialized?: boolean
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
  streak: number

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
const packFactListCache = new Map<PackKey, ReadonlyArray<string>>()

export const getPackFactList = (packName: PackKey): ReadonlyArray<string> => {
  if (packFactListCache.has(packName)) {
    return packFactListCache.get(packName)!
  }

  const ids: string[] = []
  let max = 0

  if (packName === 'add_20') {
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; b <= 20 - a; b++) {
        ids.push(`add:${a}:${b}`)
      }
    }
  } else if (packName === 'sub_20') {
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; b <= a; b++) {
        ids.push(`sub:${a}:${b}`)
      }
    }
  } else {
    if (packName === 'mul_36') max = 6
    else if (packName === 'mul_144' || packName === 'div_144') max = 12
    else if (packName === 'mul_576') max = 24
    else return []

    for (let i = 1; i <= max; i++) {
      for (let j = 1; j <= max; j++) {
        if (packName === 'div_144') {
          ids.push(`div:${i * j}:${i}`)
        } else {
          ids.push(`mul:${i}:${j}`)
        }
      }
    }
  }

  packFactListCache.set(packName, Object.freeze(ids))
  return ids
}

export const getPackFactIds = (packName: PackKey): Set<string> => {
  if (packFactIdsCache.has(packName)) {
    return packFactIdsCache.get(packName)!
  }

  const ids = new Set<string>(getPackFactList(packName))
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

export type UserSceneMeta = {
  sceneId: SceneTheme
  xp: number // total XP earned for THIS scene
  createdAt: Timestamp
  updatedAt: Timestamp
}
