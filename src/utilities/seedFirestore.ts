import {
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  query,
  limit, // For the limit(1) call
} from 'firebase/firestore'

/**
 * Seeds the initial empty cards data into Firestore.
 * @param db The Firestore database instance.
 * @returns An object indicating the result of the seeding operation.
 */

export async function seedCardsData(
  db: Firestore
): Promise<{ seeded: boolean; reason?: string }> {
  const cardsRef = collection(db, 'cards')

  // Quick check: if any card exists, assume already seeded
  const existingQuery = query(cardsRef, limit(1)) // Create a query with limit
  const existing = await getDocs(existingQuery)
  if (!existing.empty) {
    console.log('Cards already seeded. Skipping.')
    return { seeded: false, reason: 'already_seeded' }
  }

  console.log('Seeding cards data...')
  const docs: Array<Record<string, unknown>> = []
  for (let i = 1; i <= 24; i++) {
    for (let j = 1; j <= 24; j++) {
      const isMirror = j < i
      const mirrorId = isMirror ? `${j}-${i}` : null
      const is24Table = i > 12 || j > 12

      docs.push({
        id: `${i}-${j}`,
        expression: `${i} x ${j}`,
        top: i,
        bottom: j,
        value: i * j,
        table: is24Table ? 24 : 12,
        group: Math.ceil(i / 3),
        box: 1,
        nextDueTime: 0,
        lastReviewed: null,
        avgResponseTime: null,
        seen: 0,
        correct: 0,
        incorrect: 0,
        difficulty: i * j > 144 ? 'advanced' : 'basic',
        mirrorOf: mirrorId,
        isPrimary: !isMirror,
      })
    }
  }

  const BATCH_LIMIT = 500
  for (let start = 0; start < docs.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db) // Initialize batch with the db instance
    const chunk = docs.slice(start, start + BATCH_LIMIT)
    chunk.forEach((card) => {
      // For auto-generated IDs, use `doc(cardsRef)`
      const docRef = doc(cardsRef)
      setDoc(docRef, card)
    })
    await batch.commit()
    console.log(`Committed batch from ${start} to ${start + chunk.length}`)
  }

  console.log('Cards data seeding complete!')
  return { seeded: true }
}
