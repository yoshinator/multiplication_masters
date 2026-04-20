import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { auth as authV1 } from 'firebase-functions/v1'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getAuth } from 'firebase-admin/auth'
import bcrypt from 'bcryptjs'
import { MASTER_FACTS, PackMeta } from './masterCards'
import {
  EMAIL_SECRETS,
  OnboardingTemplateModel,
  recordEmailError,
  sendOnboardingEmail,
  sendPremiumWeeklyEmail,
  sendWelcomeEmail,
} from './email'

initializeApp()
const db = getFirestore()

const PROFILE_INDEX_COLLECTION = 'profileIndex'
const PROFILE_SECRETS_COLLECTION = 'profileSecrets'
const MAX_PIN_ATTEMPTS = 5
const PIN_LOCKOUT_MS = 60 * 60 * 1000
const MAX_PROFILE_LOGIN_ATTEMPTS = 12
const DEFAULT_ENABLED_PACKS = ['add_20', 'mul_36'] as const
const FREE_ENABLED_PACKS = ['add_20', 'sub_20', 'mul_36'] as const
const FREE_PACK_SET = new Set<string>(FREE_ENABLED_PACKS)
const FREE_ACTIVE_PACK_DEFAULT = 'mul_36' as const
const PROFILE_NAME_MIN_LEN = 3
const PROFILE_NAME_MAX_LEN = 20
const PROFILE_NAME_REGEX_VALIDATION = new RegExp(
  `^[a-zA-Z0-9_]{${PROFILE_NAME_MIN_LEN},${PROFILE_NAME_MAX_LEN}}$`
)
const ONBOARDING_EMAILS_TOTAL = 5
const ONBOARDING_INTERVAL_MS = 23 * 60 * 60 * 1000
const WEEK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const EMAIL_TIMEZONE = 'America/New_York'
const IDENTIFIED_METHODS = new Set(['google', 'emailLink'])

type EmailSourceMethod = 'google' | 'emailLink'

type EmailCampaignState = {
  emailWelcomeSentAt: number | null
  onboardingStartedAt: number | null
  onboardingEmailsSent: number
  onboardingLastSentAt: number | null
  premiumLastWeeklySentAt: number | null
}

const timestampToMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Number(value.toFixed(1))))
}

const getCampaignState = (
  userData: FirebaseFirestore.DocumentData | undefined
): EmailCampaignState => {
  return {
    emailWelcomeSentAt: timestampToMillis(userData?.emailWelcomeSentAt),
    onboardingStartedAt: timestampToMillis(userData?.onboardingStartedAt),
    onboardingEmailsSent:
      typeof userData?.onboardingEmailsSent === 'number'
        ? userData.onboardingEmailsSent
        : 0,
    onboardingLastSentAt: timestampToMillis(userData?.onboardingLastSentAt),
    premiumLastWeeklySentAt: timestampToMillis(
      userData?.premiumLastWeeklySentAt
    ),
  }
}

const getPreferredProfileId = (
  userData: FirebaseFirestore.DocumentData | undefined
): string | null => {
  if (
    typeof userData?.activeProfileId === 'string' &&
    userData.activeProfileId
  ) {
    return userData.activeProfileId
  }
  if (
    typeof userData?.primaryProfileId === 'string' &&
    userData.primaryProfileId
  ) {
    return userData.primaryProfileId
  }
  return null
}

const getFirstName = (
  profileData: FirebaseFirestore.DocumentData | undefined
): string => {
  const rawName =
    typeof profileData?.displayName === 'string' ? profileData.displayName : ''
  const trimmed = rawName.trim()
  if (!trimmed) return 'there'
  const [first] = trimmed.split(/\s+/)
  return first || 'there'
}

const getUserEmailAddress = async (uid: string): Promise<string | null> => {
  try {
    const userRecord = await getAuth().getUser(uid)
    const email = userRecord.email?.trim()
    return email ? email : null
  } catch (error: unknown) {
    logger.warn('Unable to fetch auth user for email send', { uid, error })
    return null
  }
}

const getEmailErrorDetails = (
  error: unknown
): { code: string; message: string } => {
  if (error instanceof Error) {
    const maybeCode =
      typeof (error as Error & { code?: unknown }).code === 'string'
        ? (error as Error & { code: string }).code
        : 'unknown'
    return { code: maybeCode, message: error.message }
  }
  return { code: 'unknown', message: String(error) }
}

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

const normalizeToFreePackSelection = (): {
  enabledPacks: string[]
  activePack: string
} => ({
  enabledPacks: [...FREE_ENABLED_PACKS],
  activePack: FREE_ACTIVE_PACK_DEFAULT,
})

const PAGE_SIZE = 200

const forEachDocPage = async (
  collectionRef: FirebaseFirestore.CollectionReference,
  onDoc: (doc: FirebaseFirestore.QueryDocumentSnapshot) => Promise<void> | void
): Promise<number> => {
  let processed = 0
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null

  while (true) {
    let query = collectionRef.orderBy('__name__').limit(PAGE_SIZE)
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const snap = await query.get()
    if (snap.empty) break

    for (const doc of snap.docs) {
      await onDoc(doc)
      processed++
    }

    lastDoc = snap.docs[snap.docs.length - 1]
  }

  return processed
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
      emailWelcomeSentAt: null,
      emailWelcomeSource: null,
      onboardingStartedAt: null,
      onboardingEmailsSent: 0,
      onboardingLastSentAt: null,
      premiumLastWeeklySentAt: null,
      emailLastErrorAt: null,
      emailLastErrorCode: null,
      emailLastErrorMessage: null,
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

async function withConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.allSettled(items.slice(i, i + concurrency).map(fn))
  }
}

const resolveProfileId = async (
  uid: string,
  userData: FirebaseFirestore.DocumentData | undefined
): Promise<string | null> => {
  const preferredId = getPreferredProfileId(userData)
  if (preferredId) return preferredId

  const profilesSnap = await db
    .collection('users')
    .doc(uid)
    .collection('profiles')
    .limit(1)
    .get()

  if (profilesSnap.empty) return null
  return profilesSnap.docs[0].id
}

type ProfileSummary = {
  firstName: string
  lifetimeAccuracy: number
  totalSessions: number
  weeklySessions: number
  weeklyCorrect: number
  weeklyIncorrect: number
  weeklyAccuracy: number
  masteryPercent: number
}

const getProfileSummary = async (
  uid: string,
  profileId: string,
  weekStartMs: number
): Promise<ProfileSummary> => {
  const profileRef = db
    .collection('users')
    .doc(uid)
    .collection('profiles')
    .doc(profileId)
  const sessionsRef = profileRef.collection('Sessions')
  const factsRef = profileRef.collection('UserFacts')

  const [profileSnap, sessionsSnap, masteredAgg, totalAgg] = await Promise.all([
    profileRef.get(),
    sessionsRef.where('endedAt', '>=', weekStartMs).get(),
    factsRef.where('box', '>', 3).count().get(),
    factsRef.count().get(),
  ])

  const profileData = profileSnap.data()

  let weeklyCorrect = 0
  let weeklyIncorrect = 0

  for (const sessionDoc of sessionsSnap.docs) {
    const sessionData = sessionDoc.data() as {
      correct?: unknown
      incorrect?: unknown
    }
    weeklyCorrect +=
      typeof sessionData.correct === 'number' ? sessionData.correct : 0
    weeklyIncorrect +=
      typeof sessionData.incorrect === 'number' ? sessionData.incorrect : 0
  }

  const weeklyTotal = weeklyCorrect + weeklyIncorrect
  const weeklyAccuracy =
    weeklyTotal > 0 ? clampPercentage((weeklyCorrect / weeklyTotal) * 100) : 0

  const totalFacts = totalAgg.data().count
  const masteredFacts = masteredAgg.data().count
  const masteryPercent =
    totalFacts > 0 ? clampPercentage((masteredFacts / totalFacts) * 100) : 0

  const lifetimeCorrect =
    typeof profileData?.lifetimeCorrect === 'number'
      ? profileData.lifetimeCorrect
      : 0
  const lifetimeIncorrect =
    typeof profileData?.lifetimeIncorrect === 'number'
      ? profileData.lifetimeIncorrect
      : 0
  const lifetimeTotal = lifetimeCorrect + lifetimeIncorrect

  return {
    firstName: getFirstName(profileData),
    totalSessions:
      typeof profileData?.totalSessions === 'number'
        ? profileData.totalSessions
        : 0,
    lifetimeAccuracy:
      lifetimeTotal > 0
        ? clampPercentage((lifetimeCorrect / lifetimeTotal) * 100)
        : 0,
    weeklySessions: sessionsSnap.size,
    weeklyCorrect,
    weeklyIncorrect,
    weeklyAccuracy,
    masteryPercent,
  }
}

export const sendWelcomeOnIdentifiedSignIn = onDocumentUpdated(
  {
    document: 'users/{userId}',
    secrets: [...EMAIL_SECRETS],
  },
  async (event) => {
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()
    if (!afterData) return

    const userId = event.params.userId
    const afterMethod =
      typeof afterData.lastSignInMethod === 'string'
        ? afterData.lastSignInMethod
        : null
    const beforeMethod =
      typeof beforeData?.lastSignInMethod === 'string'
        ? beforeData.lastSignInMethod
        : null

    if (!afterMethod || !IDENTIFIED_METHODS.has(afterMethod)) return

    const campaignState = getCampaignState(afterData)
    if (campaignState.emailWelcomeSentAt) return

    const transitionedFromAnonymous =
      beforeMethod === null || beforeMethod === 'anonymous'
    if (!transitionedFromAnonymous) return

    const userEmail = await getUserEmailAddress(userId)
    if (!userEmail) {
      logger.info('Welcome email skipped: no email address found', { userId })
      return
    }

    const profileId = await resolveProfileId(userId, afterData)
    const profileData = profileId
      ? (
          await db
            .collection('users')
            .doc(userId)
            .collection('profiles')
            .doc(profileId)
            .get()
        ).data()
      : undefined

    const userRef = db.collection('users').doc(userId)

    try {
      await sendWelcomeEmail(userEmail, {
        first_name: getFirstName(profileData),
      })

      const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> =
        {
          emailWelcomeSentAt: FieldValue.serverTimestamp(),
          emailWelcomeSource: afterMethod as EmailSourceMethod,
          emailLastErrorAt: null,
          emailLastErrorCode: null,
          emailLastErrorMessage: null,
          updatedAt: FieldValue.serverTimestamp(),
        }

      if (
        afterData.subscriptionStatus !== 'premium' &&
        !campaignState.onboardingStartedAt
      ) {
        updates.onboardingStartedAt = FieldValue.serverTimestamp()
        updates.onboardingEmailsSent = 0
        updates.onboardingLastSentAt = null
      }

      await userRef.set(updates, { merge: true })

      logger.info('Welcome email sent', { userId, source: afterMethod })
    } catch (error: unknown) {
      recordEmailError('sendWelcomeOnIdentifiedSignIn', userId, error)
      const details = getEmailErrorDetails(error)
      await userRef.set(
        {
          emailLastErrorAt: FieldValue.serverTimestamp(),
          emailLastErrorCode: details.code,
          emailLastErrorMessage: details.message,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }
  }
)

export const normalizePacksOnPremiumDowngrade = onDocumentUpdated(
  { document: 'users/{userId}' },
  async (event) => {
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()
    if (!afterData || !event.data?.after.ref) return

    const beforeStatus =
      typeof beforeData?.subscriptionStatus === 'string'
        ? beforeData.subscriptionStatus
        : null
    const afterStatus =
      typeof afterData.subscriptionStatus === 'string'
        ? afterData.subscriptionStatus
        : null

    if (beforeStatus !== 'premium' || afterStatus !== 'free') return

    const uid = event.params.userId
    const userRef = event.data.after.ref
    const freeSelection = normalizeToFreePackSelection()

    logger.info('Normalizing packs on premium downgrade', { uid })

    let batch = db.batch()
    let opCount = 0
    const commitThreshold = 400
    let profileCount = 0
    let classroomCount = 0
    let rosterCount = 0

    const commitBatch = async () => {
      if (opCount === 0) return
      await batch.commit()
      batch = db.batch()
      opCount = 0
    }

    profileCount = await forEachDocPage(
      userRef.collection('profiles'),
      async (profileDoc) => {
        batch.set(
          profileDoc.ref,
          {
            enabledPacks: freeSelection.enabledPacks,
            activePack: freeSelection.activePack,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        opCount++

        if (opCount >= commitThreshold) {
          await commitBatch()
        }
      }
    )

    classroomCount = await forEachDocPage(
      userRef.collection('classrooms'),
      async (classDoc) => {
        const classRef = classDoc.ref

        batch.set(
          classRef,
          {
            defaultEnabledPacks: freeSelection.enabledPacks,
            defaultActivePack: freeSelection.activePack,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        opCount++

        rosterCount += await forEachDocPage(
          classRef.collection('roster'),
          async (rosterDoc) => {
            batch.set(
              rosterDoc.ref,
              {
                enabledPacks: freeSelection.enabledPacks,
                activePack: freeSelection.activePack,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            )
            opCount++

            if (opCount >= commitThreshold) {
              await commitBatch()
            }
          }
        )

        if (opCount >= commitThreshold) {
          await commitBatch()
        }
      }
    )

    await commitBatch()
    logger.info('Pack normalization complete for downgraded user', {
      uid,
      profiles: profileCount,
      classrooms: classroomCount,
      rosterEntries: rosterCount,
    })
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

  const userSnap = await db.collection('users').doc(uid).get()
  const isPremium = userSnap.data()?.subscriptionStatus === 'premium'
  if (!isPremium && !FREE_PACK_SET.has(packName)) {
    throw new HttpsError(
      'permission-denied',
      'This fact pack requires an active premium subscription.'
    )
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

export {
  createCheckoutSession,
  createBillingPortalSession,
  stripeWebhook,
  getPlanPrices,
} from './stripe'

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
 * Redeems a premium_unlock promo code, granting premium for the duration
 * specified on the code document (durationMonths — variable per code).
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
    premiumExpiresAt.setMonth(
      premiumExpiresAt.getMonth() + codeData.durationMonths
    )

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

export const sendPremiumWeeklySummaryEmails = onSchedule(
  {
    schedule: 'every monday 09:00',
    timeZone: EMAIL_TIMEZONE,
    secrets: [...EMAIL_SECRETS],
  },
  async () => {
    const nowMs = Date.now()
    const weekStartMs = nowMs - WEEK_WINDOW_MS

    const usersSnap = await db
      .collection('users')
      .where('subscriptionStatus', '==', 'premium')
      .get()

    let sent = 0
    let skipped = 0

    await withConcurrency(usersSnap.docs, 10, async (userDoc) => {
      const uid = userDoc.id
      const userData = userDoc.data()
      const campaignState = getCampaignState(userData)

      if (
        campaignState.premiumLastWeeklySentAt &&
        nowMs - campaignState.premiumLastWeeklySentAt < WEEK_WINDOW_MS
      ) {
        skipped += 1
        return
      }

      const userEmail = await getUserEmailAddress(uid)
      if (!userEmail) {
        skipped += 1
        return
      }

      const profileId = await resolveProfileId(uid, userData)
      if (!profileId) {
        skipped += 1
        return
      }

      try {
        const summary = await getProfileSummary(uid, profileId, weekStartMs)
        const lastLoginMs = timestampToMillis(userData.lastLogin)
        const inactiveWeek =
          !lastLoginMs ||
          lastLoginMs < weekStartMs ||
          summary.weeklySessions === 0

        await sendPremiumWeeklyEmail(userEmail, {
          first_name: summary.firstName,
          weekly_sessions: summary.weeklySessions,
          weekly_correct: summary.weeklyCorrect,
          weekly_incorrect: summary.weeklyIncorrect,
          weekly_accuracy: summary.weeklyAccuracy,
          mastery_percent: summary.masteryPercent,
          inactive_week: inactiveWeek,
        })

        await userDoc.ref.set(
          {
            premiumLastWeeklySentAt: FieldValue.serverTimestamp(),
            emailLastErrorAt: null,
            emailLastErrorCode: null,
            emailLastErrorMessage: null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )

        sent += 1
      } catch (error: unknown) {
        recordEmailError('sendPremiumWeeklySummaryEmails', uid, error)
        const details = getEmailErrorDetails(error)
        await userDoc.ref.set(
          {
            emailLastErrorAt: FieldValue.serverTimestamp(),
            emailLastErrorCode: details.code,
            emailLastErrorMessage: details.message,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    })

    logger.info('sendPremiumWeeklySummaryEmails complete', {
      processed: usersSnap.size,
      sent,
      skipped,
    })
  }
)

export const sendOnboardingEmails = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: EMAIL_TIMEZONE,
    secrets: [...EMAIL_SECRETS],
  },
  async () => {
    const nowMs = Date.now()

    // Only fetch free users who have started the campaign and haven't finished it.
    // Requires a composite index on (subscriptionStatus ASC, onboardingStartedAt ASC,
    // onboardingEmailsSent ASC) — see firestore.indexes.json.
    const usersSnap = await db
      .collection('users')
      .where('subscriptionStatus', '==', 'free')
      .where('onboardingStartedAt', '!=', null)
      .where('onboardingEmailsSent', '<', ONBOARDING_EMAILS_TOTAL)
      .get()

    let sent = 0
    let skipped = 0

    await withConcurrency(usersSnap.docs, 10, async (userDoc) => {
      const uid = userDoc.id
      const userData = userDoc.data()
      const campaignState = getCampaignState(userData)

      const lastSentBase =
        campaignState.onboardingLastSentAt ?? campaignState.onboardingStartedAt
      if (!lastSentBase || nowMs - lastSentBase < ONBOARDING_INTERVAL_MS) {
        skipped += 1
        return
      }

      const userEmail = await getUserEmailAddress(uid)
      if (!userEmail) {
        skipped += 1
        return
      }

      const profileId = await resolveProfileId(uid, userData)
      if (!profileId) {
        skipped += 1
        return
      }

      const dayNumber = campaignState.onboardingEmailsSent + 1

      try {
        const profileSnap = await db
          .collection('users')
          .doc(uid)
          .collection('profiles')
          .doc(profileId)
          .get()
        const firstName = getFirstName(profileSnap.data())

        const model: OnboardingTemplateModel = {
          first_name: firstName,
          day_1: dayNumber === 1,
          day_2: dayNumber === 2,
          day_3: dayNumber === 3,
          day_4: dayNumber === 4,
          day_5: dayNumber === 5,
        }

        await sendOnboardingEmail(userEmail, dayNumber, model)

        await userDoc.ref.set(
          {
            onboardingEmailsSent: FieldValue.increment(1),
            onboardingLastSentAt: FieldValue.serverTimestamp(),
            emailLastErrorAt: null,
            emailLastErrorCode: null,
            emailLastErrorMessage: null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )

        sent += 1
      } catch (error: unknown) {
        recordEmailError('sendOnboardingEmails', uid, error)
        const details = getEmailErrorDetails(error)
        await userDoc.ref.set(
          {
            emailLastErrorAt: FieldValue.serverTimestamp(),
            emailLastErrorCode: details.code,
            emailLastErrorMessage: details.message,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    })

    logger.info('sendOnboardingEmails complete', {
      processed: usersSnap.size,
      sent,
      skipped,
    })
  }
)
