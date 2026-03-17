import Stripe from 'stripe'
import { defineSecret } from 'firebase-functions/params'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// ── Secrets (injected at runtime via Firebase Secret Manager) ─────────────────
// Set before deploying:
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// For local emulator use functions/.secret.local (see functions/.env.template)
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY')
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET')

// ── Types ─────────────────────────────────────────────────────────────────────
type PlanType = 'parent' | 'teacher'
type BillingPeriod = 'monthly' | 'yearly' | 'lifetime'

// ── Price ID lookup ───────────────────────────────────────────────────────────
// Non-sensitive price IDs are read from environment variables.
// Set them as Firebase Functions env vars (functions/.env for emulator,
// Firebase console or `firebase functions:config:set` for production).
// See functions/.env.template for the full list.
const PRICE_ID_ENV: Record<PlanType, Record<BillingPeriod, string>> = {
  parent: {
    monthly: process.env.STRIPE_PRICE_PARENT_MONTHLY ?? '',
    yearly: process.env.STRIPE_PRICE_PARENT_YEARLY ?? '',
    lifetime: process.env.STRIPE_PRICE_PARENT_LIFETIME ?? '',
  },
  teacher: {
    monthly: process.env.STRIPE_PRICE_TEACHER_MONTHLY ?? '',
    yearly: process.env.STRIPE_PRICE_TEACHER_YEARLY ?? '',
    lifetime: process.env.STRIPE_PRICE_TEACHER_LIFETIME ?? '',
  },
}

function getPriceId(planType: PlanType, billingPeriod: BillingPeriod): string {
  const priceId = PRICE_ID_ENV[planType][billingPeriod]
  if (!priceId) {
    throw new HttpsError(
      'internal',
      `Stripe price ID not configured for ${planType}/${billingPeriod}.`
    )
  }
  return priceId
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

function extractSubscriptionId(
  subscription:
    | string
    | Stripe.Subscription
    | null
    | undefined
): string | null {
  if (!subscription) return null
  return typeof subscription === 'string' ? subscription : subscription.id
}

async function getUserRefByCustomerId(
  customerId: string
): Promise<FirebaseFirestore.DocumentReference | null> {
  const db = getFirestore()
  const snap = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get()
  if (snap.empty) return null
  return snap.docs[0].ref
}

// ── Webhook event handlers ────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { uid, planType, billingPeriod, priceId } = session.metadata ?? {}
  if (!uid || !planType || !billingPeriod || !priceId) {
    logger.warn('checkout.session.completed: missing metadata', {
      sessionId: session.id,
    })
    return
  }

  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)

  // Guard: never overwrite a lifetime purchase with a subscription event
  const snap = await userRef.get()
  if (snap.data()?.billingPeriod === 'lifetime') {
    logger.info('checkout.session.completed: user already has lifetime; skipping', {
      uid,
    })
    return
  }

  const customerId = extractCustomerId(session.customer)

  if (billingPeriod === 'lifetime') {
    await userRef.update({
      subscriptionStatus: 'premium',
      planType,
      billingPeriod: 'lifetime',
      ...(customerId && { stripeCustomerId: customerId }),
      stripeSubscriptionId: null,
      stripePriceId: priceId,
      premiumExpiresAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    })
    logger.info('Lifetime purchase applied', { uid, planType, priceId })
    return
  }

  await userRef.update({
    subscriptionStatus: 'premium',
    planType,
    billingPeriod,
    ...(customerId && { stripeCustomerId: customerId }),
    stripeSubscriptionId: extractSubscriptionId(session.subscription),
    stripePriceId: priceId,
    premiumExpiresAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  logger.info('Subscription checkout applied', { uid, planType, billingPeriod })
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId = extractCustomerId(invoice.customer)
  if (!customerId) return

  const userRef = await getUserRefByCustomerId(customerId)
  if (!userRef) {
    logger.warn('invoice.paid: no user found for customer', { customerId })
    return
  }

  const snap = await userRef.get()
  // Lifetime users are not subscription-managed
  if (snap.data()?.billingPeriod === 'lifetime') return

  // Confirms or restores premium status on successful payment (including renewals)
  await userRef.update({
    subscriptionStatus: 'premium',
    stripeSubscriptionId: extractSubscriptionId(
      invoice.parent?.subscription_details?.subscription
    ),
    premiumExpiresAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  logger.info('invoice.paid: premium confirmed', { customerId })
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = extractCustomerId(subscription.customer)
  if (!customerId) return

  const userRef = await getUserRefByCustomerId(customerId)
  if (!userRef) return

  const snap = await userRef.get()
  if (snap.data()?.billingPeriod === 'lifetime') return

  // Only act on clearly active states. past_due and unpaid keep the current
  // status — Stripe retries before deletion, which fires subscription.deleted.
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await userRef.update({
      subscriptionStatus: 'premium',
      stripeSubscriptionId: subscription.id,
      updatedAt: FieldValue.serverTimestamp(),
    })
    logger.info('subscription.updated: premium confirmed', {
      customerId,
      status: subscription.status,
    })
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = extractCustomerId(subscription.customer)
  if (!customerId) return

  const userRef = await getUserRefByCustomerId(customerId)
  if (!userRef) return

  const snap = await userRef.get()
  if (snap.data()?.billingPeriod === 'lifetime') return

  await userRef.update({
    subscriptionStatus: 'free',
    planType: 'none',
    billingPeriod: null,
    stripeSubscriptionId: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  logger.info('subscription.deleted: downgraded to free', { customerId })
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  // Only act on full refunds
  if (!charge.refunded || charge.amount_refunded < charge.amount) return

  const customerId = extractCustomerId(charge.customer)
  if (!customerId) return

  const userRef = await getUserRefByCustomerId(customerId)
  if (!userRef) return

  await userRef.update({
    subscriptionStatus: 'free',
    planType: 'none',
    billingPeriod: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  logger.info('charge.refunded: downgraded to free', { customerId })
}

// ── Exported Cloud Functions ──────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout session for the requested plan.
 * Returns { checkoutUrl } — the client should redirect the user to this URL.
 *
 * TODO (PR 3): After checkout completes, check for a pending promo code
 * redemption (promoCodeId) and apply it via the promo-code callable.
 *
 * TODO (PR 5): Wire checkoutUrl into the shared upgrade modal CTA.
 */
export const createCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'User must be signed in.')
    if (request.auth?.token?.profileId) {
      throw new HttpsError(
        'permission-denied',
        'Profile sessions cannot make purchases. Switch to your account first.'
      )
    }

    const { planType, billingPeriod, successUrl, cancelUrl } =
      request.data ?? {}

    if (planType !== 'parent' && planType !== 'teacher') {
      throw new HttpsError(
        'invalid-argument',
        'planType must be "parent" or "teacher".'
      )
    }
    if (
      billingPeriod !== 'monthly' &&
      billingPeriod !== 'yearly' &&
      billingPeriod !== 'lifetime'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'billingPeriod must be "monthly", "yearly", or "lifetime".'
      )
    }
    if (typeof successUrl !== 'string' || typeof cancelUrl !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'successUrl and cancelUrl are required.'
      )
    }

    // Basic URL validation to prevent open-redirect misuse
    for (const urlStr of [successUrl, cancelUrl]) {
      try {
        const { protocol } = new URL(urlStr)
        if (protocol !== 'https:' && protocol !== 'http:') throw new Error()
      } catch {
        throw new HttpsError('invalid-argument', 'Invalid redirect URL.')
      }
    }

    const stripe = new Stripe(stripeSecretKey.value())
    const db = getFirestore()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    const userData = userSnap.data()

    // Reuse existing Stripe customer record if present
    let customerId: string = userData?.stripeCustomerId ?? ''
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { uid } })
      customerId = customer.id
      await userRef.update({
        stripeCustomerId: customerId,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    const priceId = getPriceId(planType, billingPeriod)
    const isLifetime = billingPeriod === 'lifetime'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // uid + plan details are read back in the webhook to update entitlements
      metadata: { uid, planType, billingPeriod, priceId },
    })

    logger.info('Stripe checkout session created', {
      uid,
      planType,
      billingPeriod,
      sessionId: session.id,
    })

    return { checkoutUrl: session.url }
  }
)

/**
 * Stripe webhook endpoint (HTTPS, not callable).
 * Register this URL in the Stripe dashboard under Developers > Webhooks:
 *   https://REGION-PROJECT_ID.cloudfunctions.net/stripeWebhook
 *
 * Required events to enable:
 *   checkout.session.completed
 *   invoice.paid
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   charge.refunded
 *
 * TODO (PR 3): Handle promo-code expiry downgrade here or via a scheduled
 * function that checks premiumExpiresAt on login / nightly cron.
 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    const sig = req.headers['stripe-signature']
    if (!sig || typeof sig !== 'string') {
      res.status(400).send('Missing Stripe-Signature header')
      return
    }

    const stripe = new Stripe(stripeSecretKey.value())
    let event: Stripe.Event

    try {
      // req.rawBody is provided by Firebase Functions as a Buffer
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      )
    } catch (err) {
      logger.warn('Stripe webhook signature verification failed', { err })
      res.status(400).send('Webhook signature verification failed')
      return
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id })

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session
          )
          break
        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice)
          break
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          )
          break
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          )
          break
        case 'charge.refunded':
          await handleChargeRefunded(event.data.object as Stripe.Charge)
          break
        default:
          logger.info('Unhandled webhook event', { type: event.type })
      }
      res.status(200).json({ received: true })
    } catch (err) {
      logger.error('Stripe webhook handler error', {
        err,
        type: event.type,
        id: event.id,
      })
      res.status(500).send('Internal Server Error')
    }
  }
)
