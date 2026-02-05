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

// --- helpers ---
const defaultSrs = () => ({
  box: 1,
  nextDueTime: 0,
  lastReviewed: null as number | null,
  wasLastReviewCorrect: false,
  lastElapsedTime: 0,
  avgResponseTime: null as number | null,
  seen: 0,
  correct: 0,
  incorrect: 0,
})

const createFactId = (type: FactType, operands: (number | string)[]) =>
  `${type}:${operands.join(':')}`

/**
 * Generates multiplication tables.
 * For mul_36: start 1, end 6
 * For mul_144: start 1, end 12
 * For mul_576: start 1, end 24
 */
export const generateMulPack = (start: number, end: number): UserFact[] => {
  const facts: UserFact[] = []

  for (let i = start; i <= end; i++) {
    for (let j = 1; j <= end; j++) {
      facts.push({
        id: createFactId('mul', [i, j]),
        type: 'mul',
        operands: [i, j],
        answer: i * j,
        level: i,
        streak: 0,
        difficulty: i <= 7 ? 'basic' : i <= 12 ? 'advanced' : 'elite',
        expression: `${i} × ${j}`,
        ...defaultSrs(),
      })
    }
  }
  return facts
}

export const MASTER_FACTS: Record<string, UserFact[]> = {
  mul_36: generateMulPack(1, 6),
  mul_144: generateMulPack(1, 12),
  mul_576: generateMulPack(1, 24),
}
