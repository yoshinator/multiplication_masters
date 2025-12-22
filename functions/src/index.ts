import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'

// Initialize Admin SDK
initializeApp()
const db = getFirestore()

// Default values for card initialization
const DEFAULT_BOX = 1
const DEFAULT_DIFFICULTY = 'basic' as const
const DEFAULT_TABLE = 12

/**
 * Interface for Card data.
 * Added 'id' which is typically derived from the document ID.
 */
interface Card {
  id: string
  avgResponseTime: number | null
  bottom: number
  box: number
  correct: number
  correctDivision: number
  difficulty: 'basic' | 'advanced' | 'elite'
  expression: string
  group: number
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

/**
 * Cloud Function (v2) triggered when a new user document is created.
 */
export const initializeUserCards = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    // v2 uses event.params and event.data
    const userId = event.params.userId

    if (!event.data) {
      logger.error(`No data associated with the event for user: ${userId}`)
      return
    }

    try {
      logger.info(`Initializing UserCards for user: ${userId}`)

      // Get all cards from the master collection
      const cardsSnapshot = await db.collection('cards').get()

      if (cardsSnapshot.empty) {
        logger.warn(
          'Master cards collection is empty. Cannot initialize UserCards.'
        )
        return
      }

      // Map snapshots to Card objects with proper type safety
      const cards: Card[] = cardsSnapshot.docs.map(
        (doc: QueryDocumentSnapshot) => {
          const data = doc.data()
          return {
            id: doc.id,
            avgResponseTime: data.avgResponseTime ?? null,
            bottom: data.bottom ?? 0,
            box: data.box ?? DEFAULT_BOX,
            correct: data.correct ?? 0,
            correctDivision: data.correctDivision ?? 0,
            difficulty: data.difficulty ?? DEFAULT_DIFFICULTY,
            expression: data.expression ?? '',
            group: data.group ?? 1,
            incorrect: data.incorrect ?? 0,
            incorrectDivision: data.incorrectDivision ?? 0,
            isPrimary: data.isPrimary ?? false,
            lastReviewed: data.lastReviewed ?? null,
            mirrorOf: data.mirrorOf ?? '',
            nextDueTime: data.nextDueTime ?? 0,
            seen: data.seen ?? 0,
            table: data.table ?? DEFAULT_TABLE,
            top: data.top ?? 0,
            value: data.value ?? 0,
            wasLastReviewCorrect: data.wasLastReviewCorrect ?? false,
            wasLastDivisionReviewCorrect:
              data.wasLastDivisionReviewCorrect ?? false,
            lastElapsedTime: data.lastElapsedTime ?? 0,
          } as Card
        }
      )

      logger.info(
        `Found ${cards.length} cards to initialize for user ${userId}`
      )

      const BATCH_SIZE = 500
      const userCardsRef = db
        .collection('users')
        .doc(userId)
        .collection('UserCards')

      // Write cards in batches
      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = db.batch()
        const chunk = cards.slice(i, i + BATCH_SIZE)

        chunk.forEach((card) => {
          // Strip ID before saving if you don't want it as a field inside the doc
          const { id, ...cardData } = card
          const cardRef = userCardsRef.doc(id)
          batch.set(cardRef, cardData)
        })

        await batch.commit()
        logger.info(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1} committed for user ${userId}`
        )
      }

      logger.info(
        `Successfully initialized ${cards.length} UserCards for user ${userId}`
      )
    } catch (error) {
      logger.error(`Error initializing UserCards for user ${userId}:`, error)
    }
  }
)
