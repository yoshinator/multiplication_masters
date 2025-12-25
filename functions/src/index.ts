import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions' // Import the logger
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { MASTER_CARDS } from './masterCards'

initializeApp()
const db = getFirestore()

export const initializeUserCards = onDocumentCreated(
  {
    document: 'users/{userId}',
    cpu: 1,
    memory: '512MiB',
  },
  async (event) => {
    const userId = event.params.userId
    const userCardsRef = db
      .collection('users')
      .doc(userId)
      .collection('UserCards')

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

      // Helpful to troubleshoot users with missing cards
      await db
        .collection('users')
        .doc(userId)
        .update({ cardsInitialized: true })
    } catch (error) {
      // Log the full error object for Google Cloud Logging
      logger.error(`Failed to initialize UserCards for user: ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Rethrow so function retries automatically.
      // (Note: Requires retry-on-failure to be enabled in Google Cloud Console)
      throw error
    }
  }
)
