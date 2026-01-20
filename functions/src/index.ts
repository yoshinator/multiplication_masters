import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { MASTER_FACTS, PackMeta, UserFact } from './masterCards'

initializeApp()
const db = getFirestore()

export const initializeUserMeta = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    logger.info('initializeUserMeta function triggered')
    const userId = event.params.userId
    const userRef = db.collection('users').doc(userId)

    const snap = await userRef.get()
    const data = snap.data()

    if (data?.metaInitialized === true) {
      logger.info(`Meta already initialized for user: ${userId}`)
      return
    }

    const batch = db.batch()

    // Ensure user has active/enabled pack if client didn’t set it (defensive)
    batch.set(
      userRef,
      {
        metaInitialized: true,
        enabledPacks: ['mul_36', 'mul_144'], // New users start with the free pack
        activePack: 'mul_36',
      },
      { merge: true }
    )

    await batch.commit()
    logger.info(`Initialized meta for user: ${userId}`)
  }
)

export const provisionFacts = onCall(async (request) => {
  const { packName, count = 8 } = request.data
  const uid = request.auth?.uid

  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')
  if (typeof packName !== 'string' || !(packName in MASTER_FACTS)) {
    throw new HttpsError('not-found', 'Pack name not recognized.')
  }
  const masterList = MASTER_FACTS[packName as keyof typeof MASTER_FACTS]
  if (!masterList)
    throw new HttpsError('not-found', 'Pack name not recognized.')

  const userRef = db.collection('users').doc(uid)
  const metaRef = userRef.collection('packMeta').doc(packName)
  const factsCol = userRef.collection('UserFacts')

  return await db.runTransaction(async (transaction) => {
    const meta = await getOrCreatePackMeta(
      transaction,
      metaRef,
      packName,
      masterList.length
    )

    const startIdx = meta.nextSeqToIntroduce
    if (startIdx >= masterList.length) {
      return { success: true, added: 0, message: 'Pack complete' }
    }

    // Boundary Check: Ensure we don't slice past the end of the array
    const sliceEnd = Math.min(startIdx + count, masterList.length)
    const factsToProvision = masterList.slice(startIdx, sliceEnd)

    // Use { merge: true } so we NEVER overwrite existing student progress.
    factsToProvision.forEach((f) => {
      const factRef = factsCol.doc(f.id)
      transaction.set(factRef, f, { merge: true })
    })

    const actualAddedCount = factsToProvision.length

    transaction.update(metaRef, {
      nextSeqToIntroduce: startIdx + actualAddedCount,
      isCompleted: startIdx + actualAddedCount >= masterList.length,
      lastActivity: Date.now(),
    })

    return {
      success: true,
      added: actualAddedCount,
      newCursor: startIdx + actualAddedCount,
    }
  })
})

const getOrCreatePackMeta = async (
  transaction: FirebaseFirestore.Transaction,
  metaRef: FirebaseFirestore.DocumentReference,
  packName: string,
  totalFacts: number
): Promise<PackMeta> => {
  const metaSnap = await transaction.get(metaRef)
  if (metaSnap.exists) return metaSnap.data() as PackMeta

  const newMeta: PackMeta = {
    packName,
    nextSeqToIntroduce: 0,
    totalFacts,
    isCompleted: false,
    lastActivity: Date.now(),
  }
  transaction.set(metaRef, newMeta)
  return newMeta
}

export const migrateUserToFacts = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const userRef = db.collection('users').doc(uid)
  const cardsCol = userRef.collection('UserCards')
  const factsCol = userRef.collection('UserFacts')

  // 1. Fetch only seen cards
  const snapshot = await cardsCol.where('seen', '>', 0).get()
  if (snapshot.empty) {
    // If they have no seen cards, just initialize them as a fresh user
    // so we don't keep trying to migrate them.
    await userRef.set(
      {
        metaInitialized: true,
        enabledPacks: ['mul_36', 'mul_144'],
        activePack: 'mul_36',
      },
      { merge: true }
    )
    return {
      success: true,
      message: 'No seen cards to migrate. Initialized as new.',
    }
  }

  const migratedIds = new Set<string>()
  let maxOperand = 0

  // We'll use a chunked batch approach to avoid the 500-write limit
  const batches: FirebaseFirestore.WriteBatch[] = []
  let currentBatch = db.batch()
  let opCount = 0

  const commitThreshold = 450 // leave buffer

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    // Old ID format: "3-4"
    const [op1Str, op2Str] = docSnap.id.split('-')
    const op1 = parseInt(op1Str, 10)
    const op2 = parseInt(op2Str, 10)

    if (isNaN(op1) || isNaN(op2)) continue

    maxOperand = Math.max(maxOperand, op1, op2)
    const factId = `mul:${op1}:${op2}`

    const newFact: UserFact = {
      id: factId,
      type: 'mul',
      operands: [op1, op2],
      answer: data.value,
      level: op1,
      difficulty: data.difficulty || 'basic',

      // SRS
      box: data.box || 1,
      nextDueTime: data.nextDueTime || 0,
      lastReviewed: data.lastReviewed || null,
      wasLastReviewCorrect: data.wasLastReviewCorrect || false,
      lastElapsedTime: data.lastElapsedTime || 0,
      avgResponseTime: data.avgResponseTime || null,

      // Counters
      seen: data.seen || 0,
      correct: data.correct || 0,
      incorrect: data.incorrect || 0,

      expression: `${op1} × ${op2}`,
    }

    currentBatch.set(factsCol.doc(factId), newFact)
    migratedIds.add(factId)
    opCount++

    if (opCount >= commitThreshold) {
      batches.push(currentBatch)
      currentBatch = db.batch()
      opCount = 0
    }
  }

  // 2. Determine Pack and Meta
  // If they have seen 13x13, they are in the 576 pack. Otherwise default to 144.
  const packName = maxOperand > 12 ? 'mul_576' : 'mul_144'
  const masterList = MASTER_FACTS[packName]

  if (masterList) {
    // Find first missing index to set cursor.
    // This ensures provisionFacts fills any holes in their knowledge first.
    let nextSeq = 0
    for (let i = 0; i < masterList.length; i++) {
      if (!migratedIds.has(masterList[i].id)) {
        nextSeq = i
        break
      }
      if (i === masterList.length - 1) nextSeq = masterList.length
    }

    const metaRef = userRef.collection('packMeta').doc(packName)
    currentBatch.set(
      metaRef,
      {
        packName,
        totalFacts: masterList.length,
        isCompleted: nextSeq >= masterList.length,
        nextSeqToIntroduce: nextSeq,
        lastActivity: Date.now(),
      },
      { merge: true }
    )

    // Update user pointers
    currentBatch.set(
      userRef,
      {
        activePack: packName,
        enabledPacks: ['mul_36', 'mul_144'], // Ensure basics are enabled
        metaInitialized: true,
      },
      { merge: true }
    )
  }

  batches.push(currentBatch)

  // Commit all
  for (const batch of batches) {
    await batch.commit()
  }

  return { success: true, count: migratedIds.size, pack: packName }
})
