import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Type definition for a card from the master collection.
 * This matches the UserCard type from the client but uses 
 * firestore types for admin SDK.
 */
interface Card {
  avgResponseTime: number | null;
  bottom: number;
  box: number;
  correct: number;
  correctDivision: number;
  difficulty: 'basic' | 'advanced' | 'elite';
  expression: string;
  group: number;
  id: string;
  incorrect: number;
  incorrectDivision: number;
  isPrimary: boolean;
  lastReviewed: number | null;
  mirrorOf: string;
  nextDueTime: number;
  seen: number;
  table: number;
  top: number;
  value: number;
  wasLastReviewCorrect: boolean;
  wasLastDivisionReviewCorrect: boolean;
  lastElapsedTime: number;
}

/**
 * Cloud Function triggered when a new user document is created.
 * This function initializes the user's card collection by copying
 * all cards from the master 'cards' collection to the user's
 * 'UserCards' subcollection.
 * 
 * This avoids blocking the client with expensive read/write operations
 * (576 cards read + batched writes).
 * 
 * Error Handling Strategy:
 * - If initialization fails, the error is logged but doesn't block user creation
 * - The client will see an empty UserCards collection initially
 * - Users can trigger a manual re-initialization via a "Reload Cards" button
 *   in the UI, or cards will be automatically re-initialized on next login
 * - Consider adding a Firestore trigger or scheduled function to detect and
 *   fix users with missing cards
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

      const cards: Card[] = cardsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          avgResponseTime: data.avgResponseTime ?? null,
          bottom: data.bottom ?? 0,
          box: data.box ?? 1,
          correct: data.correct ?? 0,
          correctDivision: data.correctDivision ?? 0,
          difficulty: data.difficulty ?? 'basic',
          expression: data.expression ?? '',
          group: data.group ?? 1,
          incorrect: data.incorrect ?? 0,
          incorrectDivision: data.incorrectDivision ?? 0,
          isPrimary: data.isPrimary ?? false,
          lastReviewed: data.lastReviewed ?? null,
          mirrorOf: data.mirrorOf ?? '',
          nextDueTime: data.nextDueTime ?? 0,
          seen: data.seen ?? 0,
          table: data.table ?? 12,
          top: data.top ?? 0,
          value: data.value ?? 0,
          wasLastReviewCorrect: data.wasLastReviewCorrect ?? false,
          wasLastDivisionReviewCorrect: data.wasLastDivisionReviewCorrect ?? false,
          lastElapsedTime: data.lastElapsedTime ?? 0,
        } as Card;
      });

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
      // The error is logged for monitoring, and the issue can be detected and resolved
      // by checking for users with empty UserCards collections
    }
  });
