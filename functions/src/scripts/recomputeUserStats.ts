import { applicationDefault, initializeApp } from 'firebase-admin/app'
import {
  FieldPath,
  FieldValue,
  getFirestore,
  type DocumentReference,
} from 'firebase-admin/firestore'

type UserStats = {
  totalSessions: number
  lifetimeCorrect: number
  lifetimeIncorrect: number
  totalAccuracy: number
}

type RecomputeResult =
  | { uid: string; status: 'missing-user-doc' }
  | { uid: string; status: 'up-to-date' }
  | {
      uid: string
      status: 'needs-update'
      current: Partial<UserStats> | undefined
      next: UserStats
      patch: Partial<UserStats>
      userRef: DocumentReference
    }

type CliOptions = {
  dryRun: boolean
  yes: boolean
  uid: string | null
  limit: number | null
  startAfter: string | null
}

const parseArgs = (argv: string[]): CliOptions => {
  const args = new Set(argv)
  const getValue = (flag: string): string | null => {
    const idx = argv.indexOf(flag)
    if (idx === -1) return null
    return argv[idx + 1] ?? null
  }

  return {
    dryRun: args.has('--dry-run') || args.has('-n'),
    yes: args.has('--yes') || args.has('-y'),
    uid: getValue('--uid'),
    limit: (() => {
      const v = getValue('--limit')
      if (!v) return null
      const n = Number(v)
      return Number.isFinite(n) && n > 0 ? n : null
    })(),
    startAfter: getValue('--start-after'),
  }
}

const countSessions = async (userRef: DocumentReference): Promise<number> => {
  try {
    const snap = await userRef.collection('Sessions').count().get()
    const data = snap.data()
    if (typeof data.count === 'number') return data.count
  } catch {
    // Ignore and fall back.
  }

  const snap = await userRef.collection('Sessions').get()
  return snap.size
}

const sumFactCounters = async (
  userRef: DocumentReference
): Promise<{
  correct: number
  incorrect: number
}> => {
  const snap = await userRef
    .collection('UserFacts')
    .select('correct', 'incorrect')
    .get()

  let correct = 0
  let incorrect = 0

  for (const doc of snap.docs) {
    const data = doc.data() as { correct?: unknown; incorrect?: unknown }
    if (typeof data.correct === 'number') correct += data.correct
    if (typeof data.incorrect === 'number') incorrect += data.incorrect
  }

  return { correct, incorrect }
}

const computeStatsFromFacts = (
  correct: number,
  incorrect: number,
  totalSessions: number
): UserStats => {
  const totalQuestions = correct + incorrect
  const totalAccuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 100

  return {
    totalSessions,
    lifetimeCorrect: correct,
    lifetimeIncorrect: incorrect,
    totalAccuracy,
  }
}

const recomputeUser = async (
  db: FirebaseFirestore.Firestore,
  uid: string
): Promise<RecomputeResult> => {
  const userRef = db.collection('users').doc(uid)
  const [userSnap, sessionsCount, factSums] = await Promise.all([
    userRef.get(),
    countSessions(userRef),
    sumFactCounters(userRef),
  ])

  if (!userSnap.exists) {
    return { uid, status: 'missing-user-doc' }
  }

  const current = userSnap.data() as Partial<UserStats> | undefined
  const next = computeStatsFromFacts(
    factSums.correct,
    factSums.incorrect,
    sessionsCount
  )

  const patch: Partial<UserStats> = {}
  if (current?.totalSessions !== next.totalSessions) {
    patch.totalSessions = next.totalSessions
  }
  if (current?.lifetimeCorrect !== next.lifetimeCorrect) {
    patch.lifetimeCorrect = next.lifetimeCorrect
  }
  if (current?.lifetimeIncorrect !== next.lifetimeIncorrect) {
    patch.lifetimeIncorrect = next.lifetimeIncorrect
  }
  if (current?.totalAccuracy !== next.totalAccuracy) {
    patch.totalAccuracy = next.totalAccuracy
  }

  const needsUpdate = Object.keys(patch).length > 0

  if (!needsUpdate) {
    return { uid, status: 'up-to-date' }
  }

  return { uid, status: 'needs-update', current, next, patch, userRef }
}

async function main() {
  const { dryRun, yes, uid, limit, startAfter } = parseArgs(process.argv)

  if (!dryRun && !yes) {
    throw new Error(
      'Refusing to write without confirmation. Re-run with --dry-run or --yes.'
    )
  }

  initializeApp({ credential: applicationDefault() })
  const db = getFirestore()

  if (uid) {
    const result = await recomputeUser(db, uid)
    if (result.status !== 'needs-update') {
      console.log(`[${uid}] SKIP`, result.status)
      return
    }

    console.log(`[${uid}]`, dryRun ? 'DRY-RUN' : 'UPDATE', result.patch)
    if (!dryRun) {
      await result.userRef.update({
        ...result.patch,
        statsRecomputedAt: FieldValue.serverTimestamp(),
      })
    }
    return
  }

  let processed = 0
  let updated = 0
  let skipped = 0
  let lastDocId: string | null = null

  while (true) {
    let q: FirebaseFirestore.Query = db
      .collection('users')
      .orderBy(FieldPath.documentId())
      .limit(200)

    const startAfterId = lastDocId ?? startAfter
    if (startAfterId) {
      q = q.startAfter(startAfterId)
    }

    const page = await q.get()
    if (page.empty) break

    for (const doc of page.docs) {
      const thisUid = doc.id
      lastDocId = thisUid

      const result = await recomputeUser(db, thisUid)

      processed++

      if (result.status !== 'needs-update') {
        skipped++
      } else {
        console.log(
          `[${thisUid}] ${dryRun ? 'DRY-RUN' : 'UPDATE'}:`,
          result.patch
        )
        if (!dryRun) {
          await result.userRef.update({
            ...result.patch,
            statsRecomputedAt: FieldValue.serverTimestamp(),
          })
        }
        updated++
      }

      if (limit != null && processed >= limit) {
        console.log('Reached --limit. Stopping.')
        console.log({ processed, updated, skipped, lastDocId })
        return
      }

      if (processed % 50 === 0) {
        console.log('Progress:', { processed, updated, skipped, lastDocId })
      }
    }
  }

  console.log('Done:', { processed, updated, skipped, lastDocId })
}

if (require.main === module) {
  void main().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
}
