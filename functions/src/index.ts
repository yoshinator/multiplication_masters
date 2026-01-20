import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { MASTER_FACTS, PackMeta } from './masterCards'

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
  const masterList = MASTER_FACTS[packName]
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
