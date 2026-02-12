import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const PROFILE_INDEX_COLLECTION = 'profileIndex'
const DEFAULT_ENABLED_PACKS = ['add_20', 'mul_36'] as const

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

const normalizeLoginNameKey = (loginName: string): string =>
  loginName.trim().toLowerCase()

const isValidLoginName = (loginName: string): boolean => {
  const u = loginName.trim()
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

type Args = {
  uid?: string
  dryRun: boolean
  limit?: number
  deleteOld: boolean
}

type MigrateResult = {
  uid: string
  profileId?: string
  loginName?: string
  copied: Record<string, number>
  skippedReason?: string
}

const parseArgs = (): Args => {
  const args = process.argv.slice(2)
  const out: Args = {
    dryRun: args.includes('--dry-run'),
    deleteOld: args.includes('--delete-old'),
  }

  const uidIdx = args.indexOf('--uid')
  if (uidIdx !== -1 && args[uidIdx + 1]) {
    out.uid = args[uidIdx + 1]
  }

  const limitIdx = args.indexOf('--limit')
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    const parsed = Number.parseInt(args[limitIdx + 1], 10)
    if (!Number.isNaN(parsed) && parsed > 0) out.limit = parsed
  }

  return out
}

const COLLECTIONS_TO_MIGRATE = [
  'UserFacts',
  'packMeta',
  'sceneMeta',
  'savedScenes',
  'Sessions',
] as const

const MAX_LOGIN_ATTEMPTS = 12

const copyCollection = async (
  db: FirebaseFirestore.Firestore,
  sourceRef: FirebaseFirestore.CollectionReference,
  targetRef: FirebaseFirestore.CollectionReference | null,
  dryRun: boolean,
  deleteOld: boolean
): Promise<number> => {
  let copied = 0
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null

  while (true) {
    let query = sourceRef.orderBy('__name__').limit(400)
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const snap = await query.get()
    if (snap.empty) break

    if (dryRun) {
      copied += snap.size
    } else {
      if (!targetRef) {
        throw new Error('Missing target collection for migration')
      }
      let batch = db.batch()
      let ops = 0

      for (const docSnap of snap.docs) {
        batch.set(targetRef.doc(docSnap.id), docSnap.data(), { merge: true })
        ops++
        copied++

        if (deleteOld) {
          batch.delete(docSnap.ref)
          ops++
        }

        if (ops >= 450) {
          await batch.commit()
          batch = db.batch()
          ops = 0
        }
      }

      if (ops > 0) {
        await batch.commit()
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1]
  }

  return copied
}

const migrateUser = async (
  db: FirebaseFirestore.Firestore,
  uid: string,
  args: Args
): Promise<MigrateResult> => {
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) {
    return { uid, copied: {}, skippedReason: 'user-missing' }
  }

  const userData = userSnap.data() as Record<string, unknown>
  const activeProfileId =
    typeof userData.activeProfileId === 'string'
      ? userData.activeProfileId
      : null

  const profilesSnap = await userRef.collection('profiles').limit(1).get()
  if (activeProfileId && !profilesSnap.empty) {
    return { uid, copied: {}, skippedReason: 'profile-exists' }
  }

  if (!activeProfileId && !profilesSnap.empty) {
    const existingProfileId = profilesSnap.docs[0].id
    if (!args.dryRun) {
      await userRef.set({ activeProfileId: existingProfileId }, { merge: true })
    }
    return {
      uid,
      profileId: existingProfileId,
      copied: {},
      skippedReason: 'linked-existing-profile',
    }
  }

  let createdProfileId = ''
  let loginName = ''
  let displayName = ''

  if (!args.dryRun) {
    const baseName =
      typeof userData.username === 'string'
        ? userData.username
        : typeof userData.displayName === 'string'
          ? userData.displayName
          : generateRandomUsername()

    const base = sanitizeLoginNameBase(baseName)

    await db.runTransaction(async (tx) => {
      const profileRef = userRef.collection('profiles').doc()

      for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
        const candidate = buildLoginNameCandidate(base, attempt)
        if (!isValidLoginName(candidate)) continue

        const loginNameKey = normalizeLoginNameKey(candidate)
        const indexRef = db
          .collection(PROFILE_INDEX_COLLECTION)
          .doc(loginNameKey)
        const indexSnap = await tx.get(indexRef)
        if (indexSnap.exists) continue

        loginName = candidate
        displayName = baseName.trim() || candidate
        createdProfileId = profileRef.id

        tx.set(indexRef, {
          uid,
          profileId: profileRef.id,
          loginName: candidate,
          createdAt: FieldValue.serverTimestamp(),
        })

        const profilePayload: Record<string, unknown> = {
          displayName,
          loginName: candidate,
          gradeLevel: null,
          pinEnabled: false,
          showTour: userData.showTour ?? true,
          onboardingCompleted: userData.onboardingCompleted ?? false,
          learnerGradeLevels: userData.learnerGradeLevels ?? [],
          learnerCount: userData.learnerCount ?? 1,
          upgradePromptCount: userData.upgradePromptCount ?? 0,
          totalAccuracy: userData.totalAccuracy ?? 100,
          lifetimeCorrect: userData.lifetimeCorrect ?? 0,
          lifetimeIncorrect: userData.lifetimeIncorrect ?? 0,
          totalSessions: userData.totalSessions ?? 0,
          userDefaultSessionLength: userData.userDefaultSessionLength ?? 0,
          unlockedScenes: userData.unlockedScenes ?? [],
          activeScene: userData.activeScene ?? 'garden',
          newCardsSeenToday: userData.newCardsSeenToday ?? 0,
          lastNewCardDate: userData.lastNewCardDate ?? null,
          maxNewCardsPerDay: userData.maxNewCardsPerDay ?? 10,
          enabledPacks: userData.enabledPacks ?? [...DEFAULT_ENABLED_PACKS],
          activePack: userData.activePack ?? 'mul_36',
          metaInitialized: userData.metaInitialized ?? true,
          activeSavedSceneId: userData.activeSavedSceneId ?? null,
          createdAt: userData.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }

        tx.set(profileRef, profilePayload)
        tx.set(userRef, { activeProfileId: profileRef.id }, { merge: true })
        return
      }

      throw new Error('Unable to allocate unique profile login name')
    })
  }

  if (args.dryRun && !createdProfileId && !activeProfileId) {
    const baseName =
      typeof userData.username === 'string'
        ? userData.username
        : typeof userData.displayName === 'string'
          ? userData.displayName
          : generateRandomUsername()
    const base = sanitizeLoginNameBase(baseName)
    loginName = buildLoginNameCandidate(base, 0)
    displayName = baseName.trim() || loginName
    createdProfileId = 'dry-run'
  }

  const profileId = createdProfileId || activeProfileId || ''
  if (!profileId) {
    return { uid, copied: {}, skippedReason: 'profile-creation-failed' }
  }

  const profileRef = args.dryRun
    ? null
    : userRef.collection('profiles').doc(profileId)
  const copied: Record<string, number> = {}

  for (const col of COLLECTIONS_TO_MIGRATE) {
    const sourceRef = userRef.collection(col)
    const targetRef = profileRef ? profileRef.collection(col) : null
    const count = await copyCollection(
      db,
      sourceRef,
      targetRef,
      args.dryRun,
      args.deleteOld
    )
    copied[col] = count
  }

  return {
    uid,
    profileId,
    loginName: loginName || undefined,
    copied,
  }
}

const run = async () => {
  const args = parseArgs()
  initializeApp()
  const db = getFirestore()

  const results: MigrateResult[] = []

  if (args.uid) {
    results.push(await migrateUser(db, args.uid, args))
  } else {
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null
    let processed = 0

    while (true) {
      let query = db.collection('users').orderBy('__name__').limit(200)
      if (lastDoc) query = query.startAfter(lastDoc)
      if (args.limit && processed >= args.limit) break

      const snap = await query.get()
      if (snap.empty) break

      for (const docSnap of snap.docs) {
        if (args.limit && processed >= args.limit) break
        results.push(await migrateUser(db, docSnap.id, args))
        processed++
      }

      lastDoc = snap.docs[snap.docs.length - 1]
    }
  }

  const summary = results.reduce(
    (acc, result) => {
      if (result.skippedReason) {
        acc.skipped++
      } else {
        acc.migrated++
      }
      return acc
    },
    { migrated: 0, skipped: 0 }
  )

  const dryRunLabel = args.dryRun ? 'DRY RUN' : 'EXECUTED'
  console.log(`[${dryRunLabel}] Profiles migration complete.`)
  console.log(`Migrated: ${summary.migrated}, Skipped: ${summary.skipped}`)

  results.forEach((result) => {
    const copied = Object.entries(result.copied)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ')
    const suffix = result.skippedReason
      ? ` skipped=${result.skippedReason}`
      : ` profileId=${result.profileId} loginName=${result.loginName ?? ''}`
    console.log(`- ${result.uid} ${suffix} ${copied}`)
  })
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
