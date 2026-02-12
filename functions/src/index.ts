import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { auth as authV1 } from 'firebase-functions/v1'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import bcrypt from 'bcryptjs'
import { MASTER_FACTS, PackMeta, UserFact } from './masterCards'

initializeApp()
const db = getFirestore()

const USERNAME_INDEX_COLLECTION = 'usernameIndex'
const USER_SECRETS_COLLECTION = 'userSecrets'
const MAX_PIN_ATTEMPTS = 5
const PIN_LOCKOUT_MS = 60 * 60 * 1000
const MAX_USERNAME_ATTEMPTS = 10
const DEFAULT_ENABLED_PACKS = ['add_20', 'mul_36'] as const

// Pack boundaries for determining which pack a user should be in
const MAX_OPERAND_MUL_36 = 6
const MAX_OPERAND_MUL_144 = 12

const normalizeUsernameKey = (username: string): string =>
  username.trim().toLowerCase()

const isValidUsername = (username: string): boolean => {
  const u = username.trim()
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

const isValidPin = (pin: string): boolean => /^\d{6}$/.test(pin)

const adjectives = [
  'Quick',
  'Lazy',
  'Happy',
  'Brave',
  'Clever',
  'Calm',
  'Nimble',
  'Bold',
  'Lucky',
  'Swift',
  'Wise',
  'Jolly',
  'Snappy',
  'Shy',
  'Zesty',
  'Vivid',
  'Bright',
  'Cool',
  'Daring',
  'Funky',
] as const

const animals = [
  'Lion',
  'Tiger',
  'Bear',
  'Wolf',
  'Fox',
  'Eagle',
  'Shark',
  'Panda',
  'Otter',
  'Hawk',
  'Zebra',
  'Whale',
  'Sloth',
  'Koala',
  'Rabbit',
  'Falcon',
  'Dragon',
] as const

const generateRandomUsername = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const number = Math.floor(Math.random() * 10000)
  const numberStr = number.toString().padStart(4, '0')
  return `${adj}${animal}${numberStr}`
}

async function createInitialUserInTransaction(
  tx: FirebaseFirestore.Transaction,
  uid: string
): Promise<string> {
  const userRef = db.collection('users').doc(uid)

  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
    const candidate = generateRandomUsername()
    const usernameKey = normalizeUsernameKey(candidate)
    const indexRef = db.collection(USERNAME_INDEX_COLLECTION).doc(usernameKey)

    const indexSnap = await tx.get(indexRef)
    if (indexSnap.exists) continue

    tx.set(indexRef, {
      uid,
      username: candidate,
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.set(userRef, {
      uid,
      username: candidate,

      userRole: 'student',
      subscriptionStatus: 'free',
      showTour: true,
      onboardingCompleted: false,
      learnerGradeLevels: [],
      learnerCount: 1,
      upgradePromptCount: 0,

      totalAccuracy: 100,
      lifetimeCorrect: 0,
      lifetimeIncorrect: 0,
      totalSessions: 0,
      userDefaultSessionLength: 0,

      newCardsSeenToday: 0,
      maxNewCardsPerDay: 10,

      enabledPacks: [...DEFAULT_ENABLED_PACKS],
      activePack: 'mul_36',
      activeScene: 'garden',

      metaInitialized: true,

      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
    })

    const sceneMetaRef = userRef.collection('sceneMeta').doc('garden')
    tx.set(sceneMetaRef, {
      sceneId: 'garden',
      xp: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return candidate
  }

  throw new HttpsError(
    'internal',
    'Failed to generate a unique username after multiple attempts.'
  )
}

export const initializeUserOnAuthCreate = authV1
  .user()
  .onCreate(async (authUser) => {
    const uid = authUser.uid
    const userRef = db.collection('users').doc(uid)

    const username = await db.runTransaction<string | null>(async (tx) => {
      const existing = await tx.get(userRef)
      if (existing.exists) {
        return null
      }

      return await createInitialUserInTransaction(tx, uid)
    })

    if (username === null) {
      logger.info('Auth onCreate: user doc already exists; skipping init', {
        uid,
      })
      return
    }

    logger.info('Auth onCreate: initialized user doc', { uid, username })
  })

export const ensureUserInitialized = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const userRef = db.collection('users').doc(uid)

  const result = await db.runTransaction<{
    created: boolean
    username: string | null
  }>(async (tx) => {
    const existing = await tx.get(userRef)
    if (existing.exists) {
      const data = existing.data() as { username?: unknown } | undefined
      return {
        created: false,
        username: typeof data?.username === 'string' ? data.username : null,
      }
    }

    const username = await createInitialUserInTransaction(tx, uid)
    return { created: true, username }
  })

  logger.info('ensureUserInitialized result', { uid, ...result })
  return result
})

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

    // Create default scene meta for 'garden'
    const sceneMetaRef = userRef.collection('sceneMeta').doc('garden')
    batch.set(sceneMetaRef, {
      sceneId: 'garden',
      xp: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Ensure user has active/enabled pack if client didn’t set it (defensive)
    batch.set(
      userRef,
      {
        metaInitialized: true,
        enabledPacks: [...DEFAULT_ENABLED_PACKS], // New users start with the free pack
        activePack: 'mul_36',
        activeScene: 'garden',
      },
      { merge: true }
    )

    await batch.commit()
    logger.info(`Initialized meta for user: ${userId}`)
  }
)

export const setUsernamePin = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const { pin } = request.data ?? {}

  if (typeof pin !== 'string') {
    throw new HttpsError('invalid-argument', 'PIN is required.')
  }

  if (!isValidPin(pin)) {
    throw new HttpsError('invalid-argument', 'PIN must be exactly 6 digits.')
  }

  // Only allow PIN setup after the user has signed in with Google or email-link.
  // (Anonymous users cannot set a PIN.)
  const authUser = await getAuth().getUser(uid)
  const providerIds = (authUser.providerData || []).map((p) => p.providerId)
  const isEligible =
    providerIds.includes('google.com') || providerIds.includes('password')
  if (!isEligible) {
    throw new HttpsError(
      'failed-precondition',
      'To create a sign-in PIN, first sign in with Google or an email link.'
    )
  }

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const userData = userSnap.data() as
    | {
        username?: string
        usernameSetByUser?: boolean
        hasUsernamePin?: boolean
      }
    | undefined
  const existingUsername = userData?.username
  if (!existingUsername || typeof existingUsername !== 'string') {
    throw new HttpsError(
      'failed-precondition',
      'Username is not set for this account.'
    )
  }
  if (!isValidUsername(existingUsername)) {
    throw new HttpsError(
      'failed-precondition',
      'Username is not eligible for PIN sign-in.'
    )
  }

  const usernameKey = normalizeUsernameKey(existingUsername)
  const indexRef = db.collection(USERNAME_INDEX_COLLECTION).doc(usernameKey)
  const secretsRef = db.collection(USER_SECRETS_COLLECTION).doc(uid)
  const now = Date.now()

  const pinHash = await bcrypt.hash(pin, 12)

  await db.runTransaction(async (tx) => {
    const [userSnap, indexSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(indexRef),
    ])

    const userData = userSnap.data() as
      | { usernameSetByUser?: boolean; hasUsernamePin?: boolean }
      | undefined

    if (userData?.hasUsernamePin === true) {
      throw new HttpsError(
        'failed-precondition',
        'A PIN is already configured for this account.'
      )
    }

    if (indexSnap.exists) {
      const existing = indexSnap.data() as { uid?: string } | undefined
      if (existing?.uid && existing.uid !== uid) {
        throw new HttpsError(
          'already-exists',
          'This username is already in use and cannot be enabled for PIN sign-in.'
        )
      }
    }

    tx.set(indexRef, {
      uid,
      username: existingUsername.trim(),
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.set(
      secretsRef,
      {
        usernameKey,
        pinHash,
        failedAttempts: 0,
        lockoutUntil: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lockoutResetAt: now,
      },
      { merge: true }
    )

    tx.set(
      userRef,
      {
        // Lock username going forward (cannot be changed once a PIN exists).
        usernameSetByUser: true,
        hasUsernamePin: true,
      },
      { merge: true }
    )
  })

  logger.info('PIN sign-in enabled', { uid, usernameKey })
  return { success: true }
})

export const resetUsernamePinLockout = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const secretsRef = db.collection(USER_SECRETS_COLLECTION).doc(uid)
  await secretsRef.set(
    {
      failedAttempts: 0,
      lockoutUntil: null,
      updatedAt: FieldValue.serverTimestamp(),
      lockoutResetAt: Date.now(),
    },
    { merge: true }
  )

  return { success: true }
})

export const signInWithUsernamePin = onCall(async (request) => {
  const { username, pin } = request.data ?? {}

  if (typeof username !== 'string' || typeof pin !== 'string') {
    throw new HttpsError('invalid-argument', 'Username and PIN are required.')
  }

  // Validate format, but keep error generic to reduce enumeration.
  if (!isValidUsername(username) || !isValidPin(pin)) {
    throw new HttpsError('invalid-argument', 'Invalid credentials.')
  }

  const usernameKey = normalizeUsernameKey(username)
  const indexRef = db.collection(USERNAME_INDEX_COLLECTION).doc(usernameKey)
  const now = Date.now()

  const outcome = await db.runTransaction<
    | { type: 'success'; uid: string }
    | { type: 'invalid' }
    | { type: 'locked'; lockoutUntil: number }
  >(async (tx) => {
    const indexSnap = await tx.get(indexRef)
    if (!indexSnap.exists) {
      return { type: 'invalid' }
    }

    const indexData = indexSnap.data() as { uid?: string }
    const uid = indexData?.uid
    if (!uid || typeof uid !== 'string') {
      return { type: 'invalid' }
    }

    const secretsRef = db.collection(USER_SECRETS_COLLECTION).doc(uid)
    const secretsSnap = await tx.get(secretsRef)
    const secrets = secretsSnap.data() as
      | {
          pinHash?: string
          failedAttempts?: number
          lockoutUntil?: number | null
        }
      | undefined

    const lockoutUntil =
      typeof secrets?.lockoutUntil === 'number' ? secrets.lockoutUntil : null
    if (lockoutUntil && lockoutUntil > now) {
      return { type: 'locked', lockoutUntil }
    }

    const pinHash = secrets?.pinHash
    if (!pinHash || typeof pinHash !== 'string') {
      return { type: 'invalid' }
    }

    const pinOk = await bcrypt.compare(pin, pinHash)

    if (pinOk) {
      tx.set(
        secretsRef,
        {
          failedAttempts: 0,
          lockoutUntil: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return { type: 'success', uid }
    }

    const failedAttempts =
      (typeof secrets?.failedAttempts === 'number'
        ? secrets.failedAttempts
        : 0) + 1
    if (failedAttempts >= MAX_PIN_ATTEMPTS) {
      const until = now + PIN_LOCKOUT_MS
      tx.set(
        secretsRef,
        {
          failedAttempts,
          lockoutUntil: until,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return { type: 'locked', lockoutUntil: until }
    }

    tx.set(
      secretsRef,
      {
        failedAttempts,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return { type: 'invalid' }
  })

  if (outcome.type === 'locked') {
    throw new HttpsError(
      'resource-exhausted',
      'Account is locked for 1 hour. Sign in with Google or an email link to reset the lockout.'
    )
  }

  if (outcome.type === 'invalid') {
    throw new HttpsError('invalid-argument', 'Invalid credentials.')
  }

  const token = await getAuth().createCustomToken(outcome.uid)
  return { customToken: token }
})

export const provisionFacts = onCall(async (request) => {
  // 5 is the smallest number of new facts per day 30 is the max
  const { packName, count = 5 } = request.data
  if (count <= 0 || count > 30) {
    throw new HttpsError('invalid-argument', 'Count must be between 1 and 30.')
  }

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

    let actualAddedCount = 0
    for (const f of factsToProvision) {
      const factRef = factsCol.doc(f.id)
      const factSnap = await transaction.get(factRef)
      if (factSnap.exists) continue
      transaction.set(factRef, f)
      actualAddedCount += 1
    }

    transaction.update(metaRef, {
      nextSeqToIntroduce: sliceEnd,
      isCompleted: sliceEnd >= masterList.length,
      lastActivity: Date.now(),
    })

    return {
      success: true,
      added: actualAddedCount,
      newCursor: sliceEnd,
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

  const existingFacts = await factsCol.limit(1).get()
  if (!existingFacts.empty) {
    // UserFacts exist, but we still need to ensure the user is properly initialized
    // to prevent the client from repeatedly attempting migration.
    const userDoc = await userRef.get()
    const userData = userDoc.data()

    // If already marked as initialized, we're done
    if (userData?.metaInitialized) {
      return {
        success: true,
        message: 'UserFacts already exist. Already initialized.',
      }
    }

    // Determine active pack from existing facts
    // Fetch all facts to determine the highest operand
    const allFacts = await factsCol.get()
    let maxOperand = 0
    for (const factDoc of allFacts.docs) {
      const factData = factDoc.data()
      if (
        factData.type === 'mul' &&
        Array.isArray(factData.operands) &&
        factData.operands.length >= 2
      ) {
        const op1 = factData.operands[0]
        const op2 = factData.operands[1]
        if (
          typeof op1 === 'number' &&
          typeof op2 === 'number' &&
          !isNaN(op1) &&
          !isNaN(op2)
        ) {
          maxOperand = Math.max(maxOperand, op1, op2)
        }
      }
    }

    // Determine pack based on max operand (same logic as migration)
    const packName =
      maxOperand > MAX_OPERAND_MUL_144
        ? 'mul_576'
        : maxOperand > MAX_OPERAND_MUL_36
          ? 'mul_144'
          : 'mul_36'
    const masterList = MASTER_FACTS[packName]

    if (masterList) {
      const migratedIds = new Set(allFacts.docs.map((doc) => doc.id))

      // Find first missing index to set cursor
      let nextSeq = masterList.length
      for (let i = 0; i < masterList.length; i++) {
        if (!migratedIds.has(masterList[i].id)) {
          nextSeq = i
          break
        }
      }

      const batch = db.batch()

      // Create/update pack meta
      const metaRef = userRef.collection('packMeta').doc(packName)
      batch.set(
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

      // Build enabled packs list
      const enabledPacks = DEFAULT_ENABLED_PACKS.includes(
        packName as (typeof DEFAULT_ENABLED_PACKS)[number]
      )
        ? [...DEFAULT_ENABLED_PACKS]
        : [...DEFAULT_ENABLED_PACKS, packName]

      // Mark user as initialized
      batch.set(
        userRef,
        {
          activePack: packName,
          enabledPacks,
          metaInitialized: true,
        },
        { merge: true }
      )

      await batch.commit()
    }

    return {
      success: true,
      message: 'UserFacts already exist. Initialized metadata.',
    }
  }

  // 1. Fetch only seen cards
  const snapshot = await cardsCol.where('seen', '>', 0).get()
  if (snapshot.empty) {
    // If they have no seen cards, just initialize them as a fresh user
    // so we don't keep trying to migrate them.
    await userRef.set(
      {
        metaInitialized: true,
        enabledPacks: [...DEFAULT_ENABLED_PACKS],
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
      streak: data.streak || 0,

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
  const packName = maxOperand > MAX_OPERAND_MUL_144 ? 'mul_576' : 'mul_144'
  const masterList = MASTER_FACTS[packName]

  if (masterList) {
    // Find first missing index to set cursor.
    // This ensures provisionFacts fills any holes in their knowledge first.
    let nextSeq = masterList.length
    for (let i = 0; i < masterList.length; i++) {
      if (!migratedIds.has(masterList[i].id)) {
        nextSeq = i
        break
      }
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
    // Build enabled packs list so that the active pack is always included.
    const enabledPacks = DEFAULT_ENABLED_PACKS.includes(
      packName as (typeof DEFAULT_ENABLED_PACKS)[number]
    )
      ? [...DEFAULT_ENABLED_PACKS]
      : [...DEFAULT_ENABLED_PACKS, packName]
    // Update user pointers
    currentBatch.set(
      userRef,
      {
        activePack: packName,
        enabledPacks, // Ensure basics are enabled and active pack is included
        metaInitialized: true,
      },
      { merge: true }
    )
  }

  batches.push(currentBatch)

  // Commit all
  try {
    for (const batch of batches) {
      await batch.commit()
    }
  } catch (err) {
    logger.error('Failed to migrate user cards to facts', {
      uid,
      error: (err as Error)?.message ?? err,
    })

    // Attempt rollback to ensure no partial state
    try {
      logger.info(`Initiating rollback for user ${uid}`)
      const rollbackBatches: FirebaseFirestore.WriteBatch[] = []
      let rbBatch = db.batch()
      let rbCount = 0

      for (const factId of migratedIds) {
        rbBatch.delete(factsCol.doc(factId))
        rbCount++
        if (rbCount >= 450) {
          rollbackBatches.push(rbBatch)
          rbBatch = db.batch()
          rbCount = 0
        }
      }
      // Reset metaInitialized to false to allow retry
      rbBatch.set(userRef, { metaInitialized: false }, { merge: true })
      rollbackBatches.push(rbBatch)

      for (const batch of rollbackBatches) {
        await batch.commit()
      }
      logger.info(`Rollback completed for user ${uid}`)
    } catch (rollbackErr) {
      logger.error('Rollback failed', {
        uid,
        error: (rollbackErr as Error)?.message ?? rollbackErr,
      })
    }

    throw new HttpsError(
      'internal',
      'Failed to migrate user data. Please try again later.'
    )
  }

  return { success: true, count: migratedIds.size, pack: packName }
})

export const saveUserScene = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const { objects, theme, thumbnailUrl, name, backgroundId, id, sceneId } =
    request.data
  const docId = id || sceneId

  if (!theme || !thumbnailUrl) {
    throw new HttpsError('invalid-argument', 'Missing scene data.')
  }
  if (!Array.isArray(objects)) {
    throw new HttpsError('invalid-argument', "'objects' must be an array.")
  }
  if (
    objects.some((item: unknown) => item === null || typeof item !== 'object')
  ) {
    throw new HttpsError(
      'invalid-argument',
      "Each item in 'objects' must be a non-null object."
    )
  }

  // consider checking the base path to ensure it matches expected user storage path would need to swap based on dev/prod
  let isValidThumbnail = false
  if (typeof thumbnailUrl === 'string') {
    try {
      const url = new URL(thumbnailUrl)

      // 1. Validate Domain (Allow localhost/127.0.0.1 only in emulator mode)
      const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'
      const isValidHost =
        url.hostname === 'firebasestorage.googleapis.com' ||
        (isEmulator &&
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))

      if (!isValidHost) {
        throw new HttpsError('invalid-argument', 'Invalid thumbnailUrl domain.')
      }

      // 2. Validate Bucket matches current project (dev vs prod)
      // Path format: /v0/b/<bucket>/o/...
      const projectId = process.env.GCLOUD_PROJECT
      const bucketName = url.pathname.split('/')[3]

      if (
        bucketName !== `${projectId}.firebasestorage.app` &&
        bucketName !== `${projectId}.appspot.com`
      ) {
        throw new HttpsError('invalid-argument', 'Invalid thumbnailUrl bucket.')
      }

      try {
        // Decode pathname to safely check the path structure without worrying about encoding (e.g. %2F)
        if (
          decodeURIComponent(url.pathname).includes(`/users/${uid}/scenes/`)
        ) {
          isValidThumbnail = true
        }
      } catch {
        throw new HttpsError(
          'invalid-argument',
          'Invalid thumbnailUrl encoding.'
        )
      }
    } catch (e) {
      if (e instanceof HttpsError) throw e
      // Invalid URL
    }
  }

  if (!isValidThumbnail) {
    throw new HttpsError('invalid-argument', 'Invalid thumbnailUrl.')
  }
  const userRef = db.collection('users').doc(uid)
  const savedScenesCol = userRef.collection('savedScenes')

  const sceneData = {
    name: name || 'Untitled Scene',
    theme,
    thumbnailUrl,
    objects,
    backgroundId: backgroundId || null,
  }

  if (docId) {
    const docRef = savedScenesCol.doc(docId)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      throw new HttpsError('not-found', 'Scene not found.')
    }
    await docRef.set(sceneData, { merge: true })
    return { success: true, id: docId }
  }

  // Enforce limit of 4 scenes
  const snapshot = await savedScenesCol.count().get()
  if (snapshot.data().count >= 4) {
    throw new HttpsError(
      'resource-exhausted',
      'You can only save up to 4 scenes.'
    )
  }

  const docRef = await savedScenesCol.add({
    ...sceneData,
    createdAt: Date.now(),
  })
  return { success: true, id: docRef.id }
})
