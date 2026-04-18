import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import postmark from 'postmark'

export const postmarkServerToken = defineSecret('POSTMARK_SERVER_TOKEN')
export const postmarkSenderEmail = defineSecret('POSTMARK_SENDER_EMAIL')

export const EMAIL_SECRETS = [postmarkServerToken, postmarkSenderEmail] as const

const TEMPLATE_WELCOME = 'mm_welcome_v1'
const TEMPLATE_ONBOARDING = 'mm_np_onboarding_v1'
const TEMPLATE_PREMIUM_WEEKLY = 'mm_premium_weekly_v1'

const ONBOARDING_SUBJECTS: Record<number, string> = {
  1: "Day 1: Here's how Math Builders actually works, {{first_name}}",
  2: 'Day 2: Your brain is literally rewiring right now \u{1F9E0}',
  3: "Day 3: 3 sessions in — you're building something real",
  4: 'Day 4: Parents & teachers — this part is for you',
  5: 'Last message: what Premium unlocks for Math Builders',
}

type WelcomeTemplateModel = {
  first_name: string
}

export type OnboardingTemplateModel = {
  first_name: string
  day_1: boolean
  day_2: boolean
  day_3: boolean
  day_4: boolean
  day_5: boolean
}

type PremiumWeeklyTemplateModel = {
  first_name: string
  weekly_sessions: number
  weekly_correct: number
  weekly_incorrect: number
  weekly_accuracy: number
  mastery_percent: number
  inactive_week: boolean
}

const getClient = (): postmark.ServerClient => {
  return new postmark.ServerClient(postmarkServerToken.value())
}

async function sendTemplateEmail<TModel extends Record<string, unknown>>(
  to: string,
  templateAlias: string,
  model: TModel,
  tag: string,
  subjectOverride?: string
): Promise<void> {
  const sender = postmarkSenderEmail.value()
  const client = getClient()

  await client.sendEmailWithTemplate({
    From: sender,
    To: to,
    TemplateAlias: templateAlias,
    TemplateModel: model as Record<string, unknown>,
    MessageStream: 'outbound',
    Tag: tag,
    ...(subjectOverride ? { Subject: subjectOverride } : {}),
  })
}

export const sendWelcomeEmail = async (
  to: string,
  model: WelcomeTemplateModel
): Promise<void> => {
  await sendTemplateEmail(to, TEMPLATE_WELCOME, model, 'welcome')
}

export const sendOnboardingEmail = async (
  to: string,
  dayNumber: number,
  model: OnboardingTemplateModel
): Promise<void> => {
  const subject =
    ONBOARDING_SUBJECTS[dayNumber] ??
    'Your daily Math Builders update'
  await sendTemplateEmail(
    to,
    TEMPLATE_ONBOARDING,
    model,
    `onboarding-day-${dayNumber}`,
    subject
  )
}

export const sendPremiumWeeklyEmail = async (
  to: string,
  model: PremiumWeeklyTemplateModel
): Promise<void> => {
  await sendTemplateEmail(to, TEMPLATE_PREMIUM_WEEKLY, model, 'premium-weekly')
}

export const recordEmailError = (
  context: string,
  uid: string,
  error: unknown
): void => {
  logger.error(`${context}: failed to send email`, {
    uid,
    error: error instanceof Error ? error.message : String(error),
  })
}
