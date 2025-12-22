import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function triggered when a new user document is created.
 * This function initializes the user's card collection by copying
 * all cards from the master 'cards' collection to the user's
 * 'UserCards' subcollection.
 * 
 * This avoids blocking the client with expensive read/write operations
 * (576 cards read + batched writes).
 */
export const initializeUserCards = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const db = admin.firestore();

    try {
      functions.logger.info(`Initializing UserCards for user: ${userId}`);

      // Get all cards from the master collection
      const cardsSnapshot = await db.collection('cards').get();

      if (cardsSnapshot.empty) {
        functions.logger.warn('Master cards collection is empty. Cannot initialize UserCards.');
        return;
      }

      const cards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      functions.logger.info(`Found ${cards.length} cards to initialize for user ${userId}`);

      // Firestore batches have a limit of 500 operations
      const BATCH_SIZE = 500;
      const userCardsRef = db.collection('users').doc(userId).collection('UserCards');

      // Write cards in batches
      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = cards.slice(i, i + BATCH_SIZE);

        chunk.forEach(card => {
          const cardRef = userCardsRef.doc(card.id);
          batch.set(cardRef, card);
        });

        await batch.commit();
        functions.logger.info(`Batch ${Math.floor(i / BATCH_SIZE) + 1} committed for user ${userId}`);
      }

      functions.logger.info(`Successfully initialized ${cards.length} UserCards for user ${userId}`);
    } catch (error) {
      functions.logger.error(`Error initializing UserCards for user ${userId}:`, error);
      // Don't throw - we don't want to fail user creation if card initialization fails
      // The client can handle missing cards gracefully or retry
    }
  });
