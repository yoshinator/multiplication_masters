/**
 * Create promo code documents in Firestore.
 *
 * Required flags:
 * - --code <PROMO_CODE>
 * - --months <NUMBER>
 *
 * Optional flags:
 * - --max-uses <NUMBER>      Default: 1
 * - --collection <NAME>      Default: promoCodes
 * - --project-id <ID>
 * - --service-account-path <PATH>
 * - --emulator-host <HOST:PORT>
 *
 * Production usage:
 * - Use FIREBASE_ADMIN (JSON or base64 JSON), or pass --service-account-path.
 * - Run:
 *   npm run promo:create -- --code NORWOOD2026 --months 3 --max-uses 10
 * - Use a specific project:
 *   npm run promo:create -- --code NORWOOD2026 --months 3 --project-id your-prod-project-id
 * - Or with explicit credentials file:
 *   npm run promo:create -- --code NORWOOD2026 --months 3 --service-account-path ./serviceAccount.json
 *
 * Emulator usage:
 * - FIREBASE_ADMIN is not required when --emulator-host is provided.
 * - Run:
 *   npm run promo:create:emulator -- --code TEST123 --months 1 --project-id your-local-dev-project-id
 */
import {
  cert,
  getApps,
  initializeApp,
  type AppOptions,
  type ServiceAccount,
} from 'firebase-admin/app'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  getFirestore,
  Timestamp,
  type Firestore,
} from 'firebase-admin/firestore'

type Args = {
  code?: string
  months?: number
  maxUses: number
  collection: string
  projectId?: string
  serviceAccountPath?: string
  emulatorHost?: string
}

type InitOptions = {
  projectId?: string
  serviceAccountPath?: string
  emulatorHost?: string
}

const DEFAULT_EMULATOR_PROJECT_ID = 'multiplicationmaster'

type CreateOptions = {
  db?: Firestore
  collection?: string
}

const parseServiceAccountFromEnv = (): ServiceAccount => {
  const envValue = process.env.FIREBASE_ADMIN
  if (!envValue) {
    throw new Error('Missing FIREBASE_ADMIN environment variable.')
  }

  try {
    return JSON.parse(envValue) as ServiceAccount
  } catch {
    try {
      const decoded = Buffer.from(envValue, 'base64').toString('utf8')
      return JSON.parse(decoded) as ServiceAccount
    } catch {
      throw new Error(
        'FIREBASE_ADMIN must be valid JSON or base64-encoded JSON.'
      )
    }
  }
}

const parseServiceAccountFromPath = (
  serviceAccountPath: string
): ServiceAccount => {
  try {
    const absolutePath = resolve(serviceAccountPath)
    const fileText = readFileSync(absolutePath, 'utf8')
    return JSON.parse(fileText) as ServiceAccount
  } catch {
    throw new Error(
      `Failed to read service account from path: ${serviceAccountPath}`
    )
  }
}

const parseArgs = (): Args => {
  const argv = process.argv.slice(2)
  const out: Args = {
    maxUses: 1,
    collection: 'promoCodes',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]

    if (arg === '--code' && next) {
      out.code = next
      i++
      continue
    }

    if (arg === '--months' && next) {
      const value = Number.parseInt(next, 10)
      if (!Number.isNaN(value)) out.months = value
      i++
      continue
    }

    if (arg === '--max-uses' && next) {
      const value = Number.parseInt(next, 10)
      if (!Number.isNaN(value)) out.maxUses = value
      i++
      continue
    }

    if (arg === '--collection' && next) {
      out.collection = next
      i++
      continue
    }

    if (arg === '--service-account-path' && next) {
      out.serviceAccountPath = next
      i++
      continue
    }

    if (arg === '--project-id' && next) {
      out.projectId = next
      i++
      continue
    }

    if (arg === '--emulator-host' && next) {
      out.emulatorHost = next
      i++
    }
  }

  return out
}

const getDb = (options: InitOptions = {}): Firestore => {
  if (options.emulatorHost) {
    process.env.FIRESTORE_EMULATOR_HOST = options.emulatorHost
  }

  if (getApps().length === 0) {
    const appOptions: AppOptions = {
      projectId: options.projectId,
    }

    if (options.emulatorHost) {
      appOptions.projectId ??=
        process.env.FIREBASE_PROJECT_ID ??
        process.env.GCLOUD_PROJECT ??
        DEFAULT_EMULATOR_PROJECT_ID
    } else {
      const serviceAccount = options.serviceAccountPath
        ? parseServiceAccountFromPath(options.serviceAccountPath)
        : parseServiceAccountFromEnv()

      appOptions.credential = cert(serviceAccount)
    }

    initializeApp(appOptions)
  }

  return getFirestore()
}

export async function create(
  code: string,
  months: number,
  maxUses = 1,
  options: CreateOptions = {}
) {
  const targetDb = options.db ?? getDb()
  const targetCollection = options.collection ?? 'promoCodes'

  await targetDb.collection(targetCollection).doc(code.toUpperCase()).set({
    type: 'premium_unlock',
    durationMonths: months,
    maxUses,
    uses: 0,
    expiresAt: null,
    createdAt: Timestamp.now(),
  })

  console.log(
    `Created: ${code.toUpperCase()} - ${months}mo, ${maxUses} uses in ${targetCollection}`
  )
}

const main = async () => {
  const args = parseArgs()
  if (!args.code || !args.months) {
    throw new Error(
      'Usage: --code <PROMO_CODE> --months <NUMBER> [--max-uses <NUMBER>] [--collection <NAME>] [--project-id <ID>] [--service-account-path <PATH>] [--emulator-host <HOST:PORT>]'
    )
  }

  await create(args.code, args.months, args.maxUses, {
    db: getDb({
      projectId: args.projectId,
      serviceAccountPath: args.serviceAccountPath,
      emulatorHost: args.emulatorHost,
    }),
    collection: args.collection,
  })
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  void main().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
