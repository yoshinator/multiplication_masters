import { applicationDefault, initializeApp } from 'firebase-admin/app'
import {
  getFirestore,
  Timestamp,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const DEFAULT_DAYS = 7
const DEFAULT_PAGE_SIZE = 500
const SUBCOLLECTIONS = [
  'UserFacts',
  'UserCards',
  'Sessions',
  'packMeta',
  'sceneMeta',
  'savedScenes',
] as const

type CliOptions = {
  days: number
  dryRun: boolean
  yes: boolean
  includeMissing: boolean
  limit: number | null
  projectId: string | null
}

const parseNumberArg = (args: string[], flag: string): number | null => {
  const idx = args.indexOf(flag)
  if (idx === -1) return null
  const raw = args[idx + 1]
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

const parseOptions = (args: string[]): CliOptions => {
  const days = parseNumberArg(args, '--days') ?? DEFAULT_DAYS
  const limit = parseNumberArg(args, '--limit')
  const projectId = (() => {
    const idx = args.indexOf('--project')
    if (idx === -1) return null
    return args[idx + 1] ?? null
  })()

  const dryRun = args.includes('--dry-run') || args.includes('-n')
  const yes = args.includes('--yes') || args.includes('-y')
  const includeMissing = args.includes('--include-missing')

  return {
    days,
    dryRun,
    yes,
    includeMissing,
    limit,
    projectId,
  }
}

const chunkDeleteCollection = async (
  db: FirebaseFirestore.Firestore,
  colRef: FirebaseFirestore.CollectionReference
) => {
  while (true) {
    const snap = await colRef.limit(DEFAULT_PAGE_SIZE).get()
    if (snap.empty) return

    const batch = db.batch()
    snap.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
  }
}

const deleteUserData = async (
  db: FirebaseFirestore.Firestore,
  userRef: FirebaseFirestore.DocumentReference
) => {
  const recursiveDelete = (db as unknown as { recursiveDelete?: unknown })
    .recursiveDelete
  if (typeof recursiveDelete === 'function') {
    await (recursiveDelete as (
      this: FirebaseFirestore.Firestore,
      ref: FirebaseFirestore.DocumentReference
    ) => Promise<void>).call(db, userRef)
    return
  }

  for (const name of SUBCOLLECTIONS) {
    await chunkDeleteCollection(db, userRef.collection(name))
  }

  await userRef.delete()
}

const loadMissingLastLogin = async (
  db: FirebaseFirestore.Firestore,
  limit: number | null
): Promise<QueryDocumentSnapshot[]> => {
  const results: QueryDocumentSnapshot[] = []
  let lastDoc: QueryDocumentSnapshot | null = null

  while (true) {
    let query = db
      .collection('users')
      .orderBy('__name__')
      .limit(DEFAULT_PAGE_SIZE)
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const snap = await query.get()
    if (snap.empty) break

    for (const doc of snap.docs) {
      const data = doc.data() as { lastLogin?: unknown } | undefined
      if (!data || data.lastLogin === undefined) {
        results.push(doc)
      }

      if (limit !== null && results.length >= limit) {
        return results
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1] ?? null
  }

  return results
}

const loadStaleUsers = async (
  db: FirebaseFirestore.Firestore,
  cutoff: Timestamp,
  limit: number | null
): Promise<QueryDocumentSnapshot[]> => {
  const results: QueryDocumentSnapshot[] = []
  let lastDoc: QueryDocumentSnapshot | null = null

  while (true) {
    let query = db
      .collection('users')
      .where('lastLogin', '<', cutoff)
      .orderBy('lastLogin')
      .limit(DEFAULT_PAGE_SIZE)

    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const snap = await query.get()
    if (snap.empty) break

    results.push(...snap.docs)

    lastDoc = snap.docs[snap.docs.length - 1] ?? null

    if (limit !== null && results.length >= limit) {
      return results.slice(0, limit)
    }
  }

  return results
}

const main = async () => {
  const options = parseOptions(process.argv.slice(2))

  if (!options.dryRun && !options.yes) {
    throw new Error(
      'Refusing to write without confirmation. Re-run with --dry-run or --yes.'
    )
  }

  const projectId =
    options.projectId ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    undefined

  if (projectId && !process.env.GOOGLE_CLOUD_PROJECT) {
    process.env.GOOGLE_CLOUD_PROJECT = projectId
  }

  initializeApp({ credential: applicationDefault(), projectId })

  if (options.days <= 0) {
    throw new Error('--days must be greater than 0')
  }

  const cutoffMs = Date.now() - options.days * 24 * 60 * 60 * 1000
  const cutoff = Timestamp.fromMillis(cutoffMs)

  const db = getFirestore()
  const auth = getAuth()

  const staleUsers = await loadStaleUsers(db, cutoff, options.limit)
  let missingUsers: QueryDocumentSnapshot[] = []

  if (options.includeMissing) {
    const remaining =
      options.limit === null
        ? null
        : Math.max(options.limit - staleUsers.length, 0)
    if (remaining !== 0) {
      missingUsers = await loadMissingLastLogin(db, remaining)
    }
  }

  const candidates = [...staleUsers, ...missingUsers]
  const uniqueCandidates = new Map(
    candidates.map((doc) => [doc.id, doc] as const)
  )

  console.log(
    `Found ${uniqueCandidates.size} user(s) inactive for >= ${options.days} day(s).`
  )
  console.log(`Mode: ${options.dryRun ? 'dry-run' : 'apply'}`)

  let processed = 0
  for (const [uid, doc] of uniqueCandidates) {
    processed += 1
    const data = doc.data() as { lastLogin?: { toMillis?: () => number } }
    const lastLoginMs = data?.lastLogin?.toMillis?.() ?? null

    if (options.dryRun) {
      console.log(
        `[dry-run] Would delete user ${uid} (lastLogin=${lastLoginMs ?? 'missing'})`
      )
      continue
    }

    console.log(
      `Deleting user ${uid} (lastLogin=${lastLoginMs ?? 'missing'})...`
    )

    try {
      await deleteUserData(db, doc.ref)
    } catch (error) {
      console.error(`Failed to delete Firestore data for ${uid}:`, error)
    }

    try {
      await auth.deleteUser(uid)
    } catch (error) {
      console.error(`Failed to delete auth user ${uid}:`, error)
    }
  }

  console.log(`Processed ${processed} user(s).`)
}

main().catch((error) => {
  console.error('Prune script failed:', error)
  process.exitCode = 1
})
