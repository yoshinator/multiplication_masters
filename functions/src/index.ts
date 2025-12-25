import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { MASTER_CARDS } from './masterCards'

initializeApp()
const db = getFirestore()

export const initializeUserCards = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId
    const userCardsRef = db
      .collection('users')
      .doc(userId)
      .collection('UserCards')

    const BATCH_SIZE = 500

    for (let i = 0; i < MASTER_CARDS.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const chunk = MASTER_CARDS.slice(i, i + BATCH_SIZE)

      chunk.forEach((card) => {
        // We use the ID from the card object as the Document ID
        const { id, ...cardData } = card
        batch.set(userCardsRef.doc(id), cardData)
      })

      await batch.commit()
    }
  }
)
