import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { MASTER_CARDS } from './masterCards'

initializeApp()
const db = getFirestore()

export const initializeUserCards = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId
    const userRef = db.collection('users').doc(userId)
    const userCardsRef = userRef.collection('UserCards')

    // 1. Fetch the user document to check initialization status
    const userSnap = await userRef.get()
    const userData = userSnap.data()

    if (userData?.cardsInitialized === true) {
      logger.info(`Cards already initialized for user: ${userId}. Skipping.`)
      return // Exit early
    }

    logger.info(`Starting UserCards initialization for user: ${userId}`, {
      cardCount: MASTER_CARDS.length,
    })

    try {
      const BATCH_SIZE = 500

      for (let i = 0; i < MASTER_CARDS.length; i += BATCH_SIZE) {
        const batch = db.batch()
        const chunk = MASTER_CARDS.slice(i, i + BATCH_SIZE)

        chunk.forEach((card) => {
          const { id, ...cardData } = card
          batch.set(userCardsRef.doc(id), cardData)
        })

        await batch.commit()

        logger.info(`Batch committed successfully for user ${userId}`, {
          offset: i,
          count: chunk.length,
          progress: `${Math.min(i + BATCH_SIZE, MASTER_CARDS.length)}/${MASTER_CARDS.length}`,
        })
      }

      logger.info(`Successfully finished all batches for user: ${userId}`)

      // 2. Set the flag so this doesn't run again
      await userRef.set({ cardsInitialized: true }, { merge: true })
    } catch (error) {
      logger.error(`Failed to initialize UserCards for user: ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }
)
