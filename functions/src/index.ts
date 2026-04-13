import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { auth as authV1 } from 'firebase-functions/v1'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getAuth } from 'firebase-admin/auth'
import bcrypt from 'bcryptjs'
import { MASTER_FACTS, PackMeta } from './masterCards'

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
const PROFILE_NAME_REGEX_VALIDATION = new RegExp(
  `^[a-zA-Z0-9_]{${PROFILE_NAME_MIN_LEN},${PROFILE_NAME_MAX_LEN}}$`
)

const normalizePackSelection = (
  rawEnabled: unknown,
  rawActive: unknown
): { enabledPacks: string[]; activePack: string } => {
  const enabled = Array.isArray(rawEnabled)
    ? rawEnabled.filter(
        (pack) => typeof pack === 'string' && pack in MASTER_FACTS
      )
    : []
  const uniqueEnabled = Array.from(new Set(enabled))
  if (uniqueEnabled.length === 0) {
    uniqueEnabled.push(...DEFAULT_ENABLED_PACKS)
  }

  const active =
    typeof rawActive === 'string' && rawActive in MASTER_FACTS
      ? rawActive
      : uniqueEnabled[0]
  if (!uniqueEnabled.includes(active)) {
    uniqueEnabled.push(active)
  }

  return { enabledPacks: uniqueEnabled, activePack: active }
}

const normalizeLoginNameKey = (loginName: string): string =>
  loginName.trim().toLowerCase()

const isValidLoginName = (loginName: string): boolean => {
  const u = loginName.trim()
  return PROFILE_NAME_REGEX_VALIDATION.test(u)
}

const isValidProfileName = (displayName: string): boolean => {
  const name = displayName.trim()
  return PROFILE_NAME_REGEX_VALIDATION.test(name)
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
  await createUserAccountInTransaction(tx, uid, profile.profileId)
  return profile
}

async function createUserAccountInTransaction(
  tx: FirebaseFirestore.Transaction,
  uid: string,
  primaryProfileId: string
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
      primaryProfileId,
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
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')

  const userRef = db.collection('users').doc(uid)

  const result = await db.runTransaction<{
    created: boolean
    profileId: string | null
    loginName: string | null
  }>(async (tx) => {
    const existing = await tx.get(userRef)
    if (existing.exists) {
      const data = existing.data() as
        | { activeProfileId?: unknown; primaryProfileId?: unknown }
        | undefined
      const activeProfileId =
        typeof data?.activeProfileId === 'string' ? data.activeProfileId : null

      const primaryProfileId =
        typeof data?.primaryProfileId === 'string'
          ? data.primaryProfileId
          : null
      if (!primaryProfileId && activeProfileId) {
        tx.set(
          userRef,
          {
            primaryProfileId: activeProfileId,
          },
          { merge: true }
        )
      }

      if (!activeProfileId) {
        const profile = await createProfileInTransaction(
          tx,
          uid,
          generateRandomUsername(),
          null,
          true
        )
        tx.set(
          userRef,
          {
            primaryProfileId: profile.profileId,
          },
          { merge: true }
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

    const profile = await createProfileInTransaction(
      tx,
      uid,
      name,
      normalizedGrade,
      true
    )
    if (!userExists) {
      await createUserAccountInTransaction(tx, uid, profile.profileId)
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
    const metaSnap = await transaction.get(metaRef)
    const meta: PackMeta = metaSnap.exists
      ? (metaSnap.data() as PackMeta)
      : {
          packName,
          nextSeqToIntroduce: 0,
          totalFacts: masterList.length,
          isCompleted: false,
          lastActivity: Date.now(),
        }

    const startIdx = meta.nextSeqToIntroduce
    if (startIdx >= masterList.length) {
      return { success: true, added: 0, message: 'Pack complete' }
    }

    // Boundary Check: Ensure we don't slice past the end of the array
    const sliceEnd = Math.min(startIdx + count, masterList.length)
    const factsToProvision = masterList.slice(startIdx, sliceEnd)

    const factRefs = factsToProvision.map((f) => factsCol.doc(f.id))
    const factSnaps =
      factRefs.length > 0 ? await transaction.getAll(...factRefs) : []

    let actualAddedCount = 0
    factSnaps.forEach((factSnap, idx) => {
      if (factSnap.exists) return
      const fact = factsToProvision[idx]
      if (!fact) return
      transaction.set(factRefs[idx], fact)
      actualAddedCount += 1
    })

    transaction.set(
      metaRef,
      {
        ...meta,
        nextSeqToIntroduce: sliceEnd,
        isCompleted: sliceEnd >= masterList.length,
        lastActivity: Date.now(),
      },
      { merge: true }
    )

    return {
      success: true,
      added: actualAddedCount,
      newCursor: sliceEnd,
    }
  })
})

export const applyClassroomPackDefaults = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')
  if (request.auth?.token?.profileId) {
    throw new HttpsError(
      'permission-denied',
      'Profile sessions cannot update classes.'
    )
  }

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const userRole = userSnap.data()?.userRole
  if (userRole !== 'teacher') {
    throw new HttpsError('permission-denied', 'Teacher role required.')
  }

  const { classId, defaultEnabledPacks, defaultActivePack } = request.data || {}
  if (typeof classId !== 'string' || !classId.trim()) {
    throw new HttpsError('invalid-argument', 'classId is required.')
  }

  const normalized = normalizePackSelection(
    defaultEnabledPacks,
    defaultActivePack
  )

  const classRef = userRef.collection('classrooms').doc(classId)
  const classSnap = await classRef.get()
  if (!classSnap.exists) {
    throw new HttpsError('not-found', 'Classroom not found.')
  }

  await classRef.set(
    {
      defaultEnabledPacks: normalized.enabledPacks,
      defaultActivePack: normalized.activePack,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  const rosterSnap = await classRef.collection('roster').get()
  let batch = db.batch()
  let opCount = 0
  const commitThreshold = 400

  const updates = {
    enabledPacks: normalized.enabledPacks,
    activePack: normalized.activePack,
    updatedAt: FieldValue.serverTimestamp(),
  }

  const commitBatch = async () => {
    if (opCount === 0) return
    await batch.commit()
    batch = db.batch()
    opCount = 0
  }

  for (const rosterDoc of rosterSnap.docs) {
    const rosterRef = classRef.collection('roster').doc(rosterDoc.id)
    batch.update(rosterRef, updates)
    opCount++

    const profileRef = userRef.collection('profiles').doc(rosterDoc.id)
    batch.set(profileRef, updates, { merge: true })
    opCount++

    if (opCount >= commitThreshold) {
      await commitBatch()
    }
  }

  await commitBatch()

  return { success: true, updated: rosterSnap.size }
})

export { createCheckoutSession, stripeWebhook } from './stripe'

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

// ── Promo Codes ───────────────────────────────────────────────────────────────

/**
 * Redeems a 6-month premium unlock promo code.
 * Validates the code, increments its use counter, and sets premiumExpiresAt
 * on the user doc. Lifetime subscribers cannot redeem promo codes.
 */
export const redeemPromoCode = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')
  if (request.auth?.token?.profileId) {
    throw new HttpsError(
      'permission-denied',
      'Profile sessions cannot redeem promo codes.'
    )
  }

  const { code } = request.data ?? {}
  if (typeof code !== 'string' || !code.trim()) {
    throw new HttpsError('invalid-argument', 'Promo code is required.')
  }
  const codeKey = code.trim().toUpperCase()

  const codeRef = db.collection('promoCodes').doc(codeKey)
  const userRef = db.collection('users').doc(uid)

  const result = await db.runTransaction(async (tx) => {
    const [codeSnap, userSnap] = await Promise.all([
      tx.get(codeRef),
      tx.get(userRef),
    ])

    if (!codeSnap.exists) {
      throw new HttpsError('not-found', 'Promo code not found or invalid.')
    }

    const codeData = codeSnap.data() as {
      type: string
      durationMonths: number
      expiresAt: FirebaseFirestore.Timestamp | null
      maxUses: number
      uses: number
    }

    if (codeData.type !== 'premium_unlock') {
      throw new HttpsError(
        'invalid-argument',
        'Promo code is not valid for this redemption type.'
      )
    }

    const now = new Date()
    if (codeData.expiresAt && codeData.expiresAt.toDate() < now) {
      throw new HttpsError('failed-precondition', 'Promo code has expired.')
    }

    if (codeData.uses >= codeData.maxUses) {
      throw new HttpsError(
        'resource-exhausted',
        'Promo code has reached its maximum uses.'
      )
    }

    const userData = userSnap.data()
    if (userData?.billingPeriod === 'lifetime') {
      throw new HttpsError(
        'failed-precondition',
        'Account already has a lifetime subscription.'
      )
    }

    const premiumExpiresAt = new Date(now)
    premiumExpiresAt.setMonth(premiumExpiresAt.getMonth() + codeData.durationMonths)

    tx.update(codeRef, { uses: FieldValue.increment(1) })
    tx.update(userRef, {
      subscriptionStatus: 'premium',
      promoCodeId: codeKey,
      premiumExpiresAt: Timestamp.fromDate(premiumExpiresAt),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { premiumExpiresAt: premiumExpiresAt.toISOString() }
  })

  logger.info('Promo code redeemed', { uid, code: codeKey })
  return result
})

/**
 * Daily scheduled job: downgrade users whose promo-code premium has expired.
 * Skips Stripe-managed subscriptions (stripeSubscriptionId set) and lifetime.
 */
export const checkExpiredPremium = onSchedule('every 24 hours', async () => {
  const now = Timestamp.now()

  const snap = await db
    .collection('users')
    .where('subscriptionStatus', '==', 'premium')
    .where('premiumExpiresAt', '<=', now)
    .get()

  if (snap.empty) {
    logger.info('checkExpiredPremium: no expired promo users found')
    return
  }

  const batch = db.batch()
  for (const userDoc of snap.docs) {
    const data = userDoc.data()
    // Stripe subscriptions and lifetime purchases manage their own state
    if (data.billingPeriod === 'lifetime' || data.stripeSubscriptionId) continue

    batch.update(userDoc.ref, {
      subscriptionStatus: 'free',
      premiumExpiresAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
  logger.info('checkExpiredPremium: downgraded expired promo users', {
    checked: snap.size,
  })
})
