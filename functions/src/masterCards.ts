export interface UserCard {
  // Static fields
  id: string
  expression: string
  top: number
  bottom: number
  value: number
  table: 12 | 24
  group: number
  difficulty: 'basic' | 'advanced' | 'elite'
  mirrorOf: string | null
  isPrimary: boolean

  // Progress/Tracking fields (initialized to defaults)
  nextDueTime: number
  lastReviewed: number | null
  avgResponseTime: number | null
  seen: number
  correct: number
  correctDivision: number
  incorrect: number
  incorrectDivision: number
  wasLastReviewCorrect: boolean
  wasLastDivisionReviewCorrect: boolean
  lastElapsedTime: number
  box: number
}

const generateMasterCards = (): UserCard[] => {
  const cards: UserCard[] = []
  for (let i = 1; i <= 24; i++) {
    for (let j = 1; j <= 24; j++) {
      const isMirror = j < i
      const is24Table = i > 12 || j > 12

      let difficulty: 'basic' | 'advanced' | 'elite' = 'basic'
      if (i * j > 144) difficulty = 'elite'
      else if (i * j > 64) difficulty = 'advanced'

      cards.push({
        id: `${i}-${j}`,
        expression: `${i} x ${j}`,
        top: i,
        bottom: j,
        value: i * j,
        table: is24Table ? 24 : 12,
        group: Math.ceil(i / 3),
        difficulty,
        mirrorOf: isMirror ? `${j}-${i}` : null,
        isPrimary: !isMirror,

        // Default Progress Values
        box: 1,
        nextDueTime: 0,
        lastReviewed: null,
        avgResponseTime: null,
        seen: 0,
        correct: 0,
        correctDivision: 0,
        incorrect: 0,
        incorrectDivision: 0,
        wasLastReviewCorrect: false,
        wasLastDivisionReviewCorrect: false,
        lastElapsedTime: 0,
      })
    }
  }
  return cards
}

export const MASTER_CARDS = generateMasterCards()
