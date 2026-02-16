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

const PROFILE_INDEX_COLLECTION = 'profileIndex'
const PROFILE_SECRETS_COLLECTION = 'profileSecrets'
const MAX_PIN_ATTEMPTS = 5
const PIN_LOCKOUT_MS = 60 * 60 * 1000
const MAX_PROFILE_LOGIN_ATTEMPTS = 12
const DEFAULT_ENABLED_PACKS = ['add_20', 'mul_36'] as const
const PROFILE_NAME_MIN_LEN = 3
const PROFILE_NAME_MAX_LEN = 20

const normalizeLoginNameKey = (loginName: string): string =>
  loginName.trim().toLowerCase()

const isValidLoginName = (loginName: string): boolean => {
  const u = loginName.trim()
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

const isValidProfileName = (displayName: string): boolean => {
  const name = displayName.trim()
  return /^[a-zA-Z0-9_]{3,20}$/.test(name)
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

const resolveActiveProfileId = async (
  uid: string,
  tokenProfileId: unknown
): Promise<string> => {
  if (typeof tokenProfileId === 'string' && tokenProfileId.trim()) {
    return tokenProfileId
  }

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const userData = userSnap.data() as { activeProfileId?: unknown } | undefined
  const activeProfileId =
    typeof userData?.activeProfileId === 'string'
      ? userData.activeProfileId
      : null
  if (!activeProfileId) {
    throw new HttpsError('failed-precondition', 'Active profile not set.')
  }

  return activeProfileId
}

const sanitizeLoginNameBase = (displayName: string): string => {
  const raw = displayName.trim().replace(/\s+/g, '')
  const sanitized = raw.replace(/[^a-zA-Z0-9_]/g, '')
  if (sanitized.length < 3) return ''
  return sanitized.slice(0, 20)
}

const buildLoginNameCandidate = (base: string, attempt: number): string => {
  if (!base) return generateRandomUsername()
  if (attempt === 0) return base

  const suffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  const maxBaseLength = Math.max(3, 20 - suffix.length)
  return `${base.slice(0, maxBaseLength)}${suffix}`
}

async function createProfileInTransaction(
  tx: FirebaseFirestore.Transaction,
  uid: string,
  displayName: string,
  gradeLevel: number | null,
  setActive: boolean
): Promise<{ profileId: string; loginName: string; displayName: string }> {
  const userRef = db.collection('users').doc(uid)
  const profileRef = userRef.collection('profiles').doc()
  const base = sanitizeLoginNameBase(displayName)

  for (let attempt = 0; attempt < MAX_PROFILE_LOGIN_ATTEMPTS; attempt++) {
    const candidate = buildLoginNameCandidate(base, attempt)
    if (!isValidLoginName(candidate)) continue
    const loginNameKey = normalizeLoginNameKey(candidate)
    const indexRef = db.collection(PROFILE_INDEX_COLLECTION).doc(loginNameKey)

    const indexSnap = await tx.get(indexRef)
    if (indexSnap.exists) continue

    tx.set(indexRef, {
      uid,
      profileId: profileRef.id,
      loginName: candidate,
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.set(profileRef, {
      displayName: displayName.trim() || candidate,
      loginName: candidate,
      gradeLevel,
      pinEnabled: false,
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
      updatedAt: FieldValue.serverTimestamp(),
    })

    const sceneMetaRef = profileRef.collection('sceneMeta').doc('garden')
    tx.set(sceneMetaRef, {
      sceneId: 'garden',
      xp: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    if (setActive) {
      tx.set(
        userRef,
        {
          activeProfileId: profileRef.id,
        },
        { merge: true }
      )
    }

    return {
      profileId: profileRef.id,
      loginName: candidate,
      displayName: displayName.trim() || candidate,
    }
  }

  throw new HttpsError(
    'internal',
    'Failed to generate a unique profile login name after multiple attempts.'
  )
}

async function createInitialUserInTransaction(
  tx: FirebaseFirestore.Transaction,
  uid: string
): Promise<{ profileId: string; loginName: string; displayName: string }> {
  const displayName = generateRandomUsername()
  const profile = await createProfileInTransaction(
    tx,
    uid,
    displayName,
    null,
    true
  )
  await createUserAccountInTransaction(tx, uid)
  return profile
}

async function createUserAccountInTransaction(
  tx: FirebaseFirestore.Transaction,
  uid: string
): Promise<void> {
  const userRef = db.collection('users').doc(uid)
  tx.set(
    userRef,
    {
      uid,
      userRole: 'student',
      subscriptionStatus: 'free',
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

export const initializeUserOnAuthCreate = authV1
  .user()
  .onCreate(async (authUser) => {
    const uid = authUser.uid
    const userRef = db.collection('users').doc(uid)

    const profile = await db.runTransaction<{
      profileId: string
      loginName: string
      displayName: string
    } | null>(async (tx) => {
      const existing = await tx.get(userRef)
      if (existing.exists) {
        return null
      }

      return await createInitialUserInTransaction(tx, uid)
    })

    if (profile === null) {
      logger.info('Auth onCreate: user doc already exists; skipping init', {
        uid,
      })
      return
    }

    logger.info('Auth onCreate: initialized user doc', {
      uid,
      profileId: profile.profileId,
      loginName: profile.loginName,
    })
  })

export const ensureUserInitialized = onCall(async (request) => {
  const uid = request.auth?.uid
  console.log({ uid })
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const userRef = db.collection('users').doc(uid)

  const result = await db.runTransaction<{
    created: boolean
    profileId: string | null
    loginName: string | null
  }>(async (tx) => {
    const existing = await tx.get(userRef)
    if (existing.exists) {
      const data = existing.data() as { activeProfileId?: unknown } | undefined
      const activeProfileId =
        typeof data?.activeProfileId === 'string' ? data.activeProfileId : null

      if (!activeProfileId) {
        const profile = await createProfileInTransaction(
          tx,
          uid,
          generateRandomUsername(),
          null,
          true
        )
        return {
          created: true,
          profileId: profile.profileId,
          loginName: profile.loginName,
        }
      }

      return {
        created: false,
        profileId: activeProfileId,
        loginName: null,
      }
    }

    const profile = await createInitialUserInTransaction(tx, uid)
    return {
      created: true,
      profileId: profile.profileId,
      loginName: profile.loginName,
    }
  })

  logger.info('ensureUserInitialized result', { uid, ...result })
  return result
})

export const createProfile = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const { displayName, gradeLevel } = request.data ?? {}
  const name = typeof displayName === 'string' ? displayName.trim() : ''

  if (!name) {
    throw new HttpsError('invalid-argument', 'Display name is required.')
  }
  if (
    name.length < PROFILE_NAME_MIN_LEN ||
    name.length > PROFILE_NAME_MAX_LEN ||
    !isValidProfileName(name)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Display name must be 3-20 characters and use only letters, numbers, or underscores.'
    )
  }

  let normalizedGrade: number | null = null
  if (gradeLevel !== undefined && gradeLevel !== null) {
    if (!Number.isInteger(gradeLevel) || gradeLevel < 0 || gradeLevel > 12) {
      throw new HttpsError(
        'invalid-argument',
        'Grade level must be between 0 and 12.'
      )
    }
    normalizedGrade = gradeLevel
  }

  const userRef = db.collection('users').doc(uid)

  const profile = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef)
    const userExists = userSnap.exists
    if (!userSnap.exists) {
      // Defer account creation until after all transaction reads.
    }
    const profile = await createProfileInTransaction(
      tx,
      uid,
      name,
      normalizedGrade,
      true
    )
    if (!userExists) {
      await createUserAccountInTransaction(tx, uid)
    }
    return profile
  })

  logger.info('Created profile', { uid, profileId: profile.profileId })
  return {
    profileId: profile.profileId,
    loginName: profile.loginName,
    displayName: profile.displayName,
  }
})

export const initializeUserMeta = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    logger.info('initializeUserMeta function triggered')
    const userId = event.params.userId
    const userRef = db.collection('users').doc(userId)

    const snap = await userRef.get()
    const data = snap.data()

    const activeProfileId =
      typeof data?.activeProfileId === 'string' ? data.activeProfileId : null

    if (activeProfileId) {
      logger.info(`Profile already initialized for user: ${userId}`)
      return
    }

    await db.runTransaction(async (tx) => {
      const freshSnap = await tx.get(userRef)
      const freshData = freshSnap.data() as { activeProfileId?: unknown }
      if (typeof freshData?.activeProfileId === 'string') return
      await createProfileInTransaction(
        tx,
        userId,
        generateRandomUsername(),
        null,
        true
      )
    })

    logger.info(`Initialized default profile for user: ${userId}`)
  }
)

export const setProfilePin = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const { pin, profileId } = request.data ?? {}
  if (typeof pin !== 'string') {
    throw new HttpsError('invalid-argument', 'PIN is required.')
  }
  if (!isValidPin(pin)) {
    throw new HttpsError('invalid-argument', 'PIN must be exactly 6 digits.')
  }

  const authProfileId = request.auth?.token?.profileId
  const resolvedProfileId =
    typeof authProfileId === 'string'
      ? authProfileId
      : typeof profileId === 'string'
        ? profileId
        : await resolveActiveProfileId(uid, null)

  const profileRef = db
    .collection('users')
    .doc(uid)
    .collection('profiles')
    .doc(resolvedProfileId)

  const profileSnap = await profileRef.get()
  if (!profileSnap.exists) {
    throw new HttpsError('not-found', 'Profile not found.')
  }

  const profileData = profileSnap.data() as
    | { loginName?: unknown; pinEnabled?: unknown }
    | undefined
  const loginName =
    typeof profileData?.loginName === 'string' ? profileData.loginName : null
  if (!loginName || !isValidLoginName(loginName)) {
    throw new HttpsError(
      'failed-precondition',
      'Profile login name is not set.'
    )
  }

  if (profileData?.pinEnabled === true) {
    throw new HttpsError(
      'failed-precondition',
      'A PIN is already configured for this profile.'
    )
  }

  const loginNameKey = normalizeLoginNameKey(loginName)
  const indexRef = db.collection(PROFILE_INDEX_COLLECTION).doc(loginNameKey)
  const secretsRef = db
    .collection(PROFILE_SECRETS_COLLECTION)
    .doc(resolvedProfileId)
  const now = Date.now()

  const pinHash = await bcrypt.hash(pin, 12)

  await db.runTransaction(async (tx) => {
    const [indexSnap, profileSnap] = await Promise.all([
      tx.get(indexRef),
      tx.get(profileRef),
    ])

    if (indexSnap.exists) {
      const existing = indexSnap.data() as
        | { uid?: string; profileId?: string }
        | undefined
      if (existing?.uid !== uid || existing?.profileId !== resolvedProfileId) {
        throw new HttpsError(
          'already-exists',
          'This login name is already in use.'
        )
      }
    } else {
      tx.set(indexRef, {
        uid,
        profileId: resolvedProfileId,
        loginName,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    const freshProfile = profileSnap.data() as
      | { pinEnabled?: boolean }
      | undefined
    if (freshProfile?.pinEnabled === true) {
      throw new HttpsError(
        'failed-precondition',
        'A PIN is already configured for this profile.'
      )
    }

    tx.set(
      secretsRef,
      {
        loginNameKey,
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
      profileRef,
      {
        pinEnabled: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  })

  logger.info('Profile PIN enabled', { uid, profileId: resolvedProfileId })
  return { success: true }
})

export const resetProfilePinLockout = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const { profileId } = request.data ?? {}
  const authProfileId = request.auth?.token?.profileId
  const resolvedProfileId =
    typeof authProfileId === 'string'
      ? authProfileId
      : typeof profileId === 'string'
        ? profileId
        : await resolveActiveProfileId(uid, null)

  const secretsRef = db
    .collection(PROFILE_SECRETS_COLLECTION)
    .doc(resolvedProfileId)
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

export const signInWithProfilePin = onCall(async (request) => {
  const { loginName, pin } = request.data ?? {}

  if (typeof loginName !== 'string' || typeof pin !== 'string') {
    throw new HttpsError('invalid-argument', 'Login name and PIN are required.')
  }

  if (!isValidLoginName(loginName) || !isValidPin(pin)) {
    throw new HttpsError('invalid-argument', 'Invalid credentials.')
  }

  const loginNameKey = normalizeLoginNameKey(loginName)
  const indexRef = db.collection(PROFILE_INDEX_COLLECTION).doc(loginNameKey)
  const now = Date.now()

  const outcome = await db.runTransaction<
    | { type: 'success'; uid: string; profileId: string }
    | { type: 'invalid' }
    | { type: 'locked'; lockoutUntil: number }
  >(async (tx) => {
    const indexSnap = await tx.get(indexRef)
    if (!indexSnap.exists) {
      return { type: 'invalid' }
    }

    const indexData = indexSnap.data() as
      | { uid?: string; profileId?: string }
      | undefined
    const uid = indexData?.uid
    const profileId = indexData?.profileId
    if (!uid || !profileId || typeof uid !== 'string') {
      return { type: 'invalid' }
    }

    const secretsRef = db.collection(PROFILE_SECRETS_COLLECTION).doc(profileId)
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
      return { type: 'success', uid, profileId }
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
      'Profile is locked for 1 hour. Ask a parent or teacher to reset it.'
    )
  }

  if (outcome.type === 'invalid') {
    throw new HttpsError('invalid-argument', 'Invalid credentials.')
  }

  const userRef = db.collection('users').doc(outcome.uid)
  await userRef.set(
    {
      activeProfileId: outcome.profileId,
    },
    { merge: true }
  )

  const token = await getAuth().createCustomToken(outcome.uid, {
    profileId: outcome.profileId,
  })
  return { customToken: token, profileId: outcome.profileId }
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

  const profileId = await resolveActiveProfileId(
    uid,
    request.auth?.token?.profileId
  )
  const profileRef = db
    .collection('users')
    .doc(uid)
    .collection('profiles')
    .doc(profileId)
  const metaRef = profileRef.collection('packMeta').doc(packName)
  const factsCol = profileRef.collection('UserFacts')

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

    const factRefs = factsToProvision.map((f) => factsCol.doc(f.id))
    const factSnaps = await transaction.getAll(...factRefs)

    let actualAddedCount = 0
    factSnaps.forEach((factSnap, idx) => {
      if (factSnap.exists) return
      const fact = factsToProvision[idx]
      if (!fact) return
      transaction.set(factRefs[idx], fact)
      actualAddedCount += 1
    })

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

const ensureMetaForExistingFacts = async (
  profileRef: FirebaseFirestore.DocumentReference,
  factsCol: FirebaseFirestore.CollectionReference
) => {
  const profileSnap = await profileRef.get()
  const userData = profileSnap.data() as
    | {
        activePack?: unknown
        enabledPacks?: unknown
        activeScene?: unknown
        metaInitialized?: unknown
      }
    | undefined

  const activePack =
    typeof userData?.activePack === 'string' &&
    userData.activePack in MASTER_FACTS
      ? userData.activePack
      : 'mul_36'

  const rawEnabled = Array.isArray(userData?.enabledPacks)
    ? userData?.enabledPacks
    : []
  const normalizedEnabled = rawEnabled.filter(
    (pack) => typeof pack === 'string' && pack in MASTER_FACTS
  ) as string[]

  if (normalizedEnabled.length === 0) {
    normalizedEnabled.push(...DEFAULT_ENABLED_PACKS)
  }
  if (!normalizedEnabled.includes(activePack)) {
    normalizedEnabled.push(activePack)
  }

  const activeScene =
    typeof userData?.activeScene === 'string' ? userData.activeScene : 'garden'

  const masterList = MASTER_FACTS[activePack]
  const factsSnap = await factsCol.get()
  const factIds = new Set(factsSnap.docs.map((doc) => doc.id))

  let nextSeq = masterList.length
  for (let i = 0; i < masterList.length; i++) {
    if (!factIds.has(masterList[i].id)) {
      nextSeq = i
      break
    }
  }

  const packMetaRef = profileRef.collection('packMeta').doc(activePack)
  const sceneMetaRef = profileRef.collection('sceneMeta').doc(activeScene)

  const userPatch: Record<string, unknown> = {}
  if (userData?.metaInitialized !== true) userPatch.metaInitialized = true

  await db.runTransaction(async (transaction) => {
    const packMetaSnap = await transaction.get(packMetaRef)
    if (!packMetaSnap.exists) {
      transaction.create(packMetaRef, {
        packName: activePack,
        totalFacts: masterList.length,
        isCompleted: nextSeq >= masterList.length,
        nextSeqToIntroduce: nextSeq,
        lastActivity: Date.now(),
      })
    }

    const sceneMetaSnap = await transaction.get(sceneMetaRef)
    if (!sceneMetaSnap.exists) {
      transaction.create(sceneMetaRef, {
        sceneId: activeScene,
        xp: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    if (Object.keys(userPatch).length > 0) {
      transaction.set(profileRef, userPatch, { merge: true })
    }
  })
  if (userData?.activePack !== activePack) userPatch.activePack = activePack
  if (userData?.activeScene !== activeScene) userPatch.activeScene = activeScene
  if (
    normalizedEnabled.length > 0 &&
    JSON.stringify(normalizedEnabled) !== JSON.stringify(userData?.enabledPacks)
  ) {
    userPatch.enabledPacks = normalizedEnabled
  }

  const batch = db.batch()
  if (Object.keys(userPatch).length > 0) {
    batch.set(profileRef, userPatch, { merge: true })
  }

  await batch.commit()
}

export const migrateUserToFacts = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const userRef = db.collection('users').doc(uid)
  const profileId = await resolveActiveProfileId(
    uid,
    request.auth?.token?.profileId
  )
  const profileRef = userRef.collection('profiles').doc(profileId)
  const cardsCol = userRef.collection('UserCards')
  const factsCol = profileRef.collection('UserFacts')

  const existingFacts = await factsCol.limit(1).get()
  if (!existingFacts.empty) {
    await ensureMetaForExistingFacts(profileRef, factsCol)
    return {
      success: true,
      message: 'UserFacts already exist. Skipping migration.',
    }
  }

  // 1. Fetch only seen cards
  const snapshot = await cardsCol.where('seen', '>', 0).get()
  if (snapshot.empty) {
    // If they have no seen cards, just initialize them as a fresh user
    // so we don't keep trying to migrate them.
    await userRef.set(
      {
        activeProfileId: profileId,
      },
      { merge: true }
    )
    await profileRef.set(
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
  const packName = maxOperand > 12 ? 'mul_576' : 'mul_144'
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

    const metaRef = profileRef.collection('packMeta').doc(packName)
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
      profileRef,
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

  const profileId = await resolveActiveProfileId(
    uid,
    request.auth?.token?.profileId
  )

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
        const decodedPath = decodeURIComponent(url.pathname)
        if (
          decodedPath.includes(`/users/${uid}/profiles/${profileId}/scenes/`) ||
          decodedPath.includes(`/users/${uid}/scenes/`)
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
  const profileRef = db
    .collection('users')
    .doc(uid)
    .collection('profiles')
    .doc(profileId)
  const savedScenesCol = profileRef.collection('savedScenes')

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
