import { useState, useEffect, type FC } from 'react'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CardGiftcard } from '@mui/icons-material'
import { CheckCircleOutline } from '@mui/icons-material'
import AppModal from '../AppModal/AppModal'
import SaveProgressModal from '../Login/SaveProgressModal'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useCloudFunction } from '../../hooks/useCloudFunction'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import type { BillingPeriod, PlanType } from '../../constants/dataModels'

type UpgradeModalProps = {
  onClose: () => void
}

type LivePrices = {
  parent: Record<BillingPeriod, string>
  teacher: Record<BillingPeriod, string>
}

type PlanCard = {
  billingPeriod: BillingPeriod
  label: string
  price: string
  subLabel: string
  badge?: string
}

const PARENT_PLANS: PlanCard[] = [
  {
    billingPeriod: 'monthly',
    label: 'Monthly',
    price: '$8.99',
    subLabel: 'per month',
  },
  {
    billingPeriod: 'yearly',
    label: 'Yearly',
    price: '$79.99',
    subLabel: 'per year',
    badge: 'Save 26%',
  },
  {
    billingPeriod: 'lifetime',
    label: 'Lifetime',
    price: '$149.99',
    subLabel: 'one-time',
    badge: 'Best value',
  },
]

const TEACHER_PLANS: PlanCard[] = [
  {
    billingPeriod: 'monthly',
    label: 'Monthly',
    price: '$19.99',
    subLabel: 'per month',
  },
  {
    billingPeriod: 'yearly',
    label: 'Yearly',
    price: '$199.00',
    subLabel: 'per year',
    badge: 'Save 17%',
  },
  {
    billingPeriod: 'lifetime',
    label: 'Lifetime',
    price: '$599.00',
    subLabel: 'one-time',
    badge: 'Best value',
  },
]

const PARENT_FEATURES = [
  'All packs unlocked',
  'Multiple learner profiles',
  'Full stats dashboard',
  'Top 10 missed facts',
]

const TEACHER_FEATURES = [
  'All packs unlocked',
  'Unlimited classrooms',
  'Roster over 25 students',
  'Full class analytics',
]

const UpgradeModal: FC<UpgradeModalProps> = ({ onClose }) => {
  const { user } = useUser()
  const { auth } = useFirebaseContext()
  const { showNotification } = useNotification()
  const isAnonymous = Boolean(auth?.currentUser?.isAnonymous)
  const planType: PlanType = user?.userRole === 'teacher' ? 'teacher' : 'parent'
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('yearly')

  const [livePrices, setLivePrices] = useState<LivePrices | null>(null)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')

  const { execute: fetchPrices } = useCloudFunction<
    Record<string, never>,
    LivePrices
  >('getPlanPrices')

  useEffect(() => {
    if (isAnonymous) return
    fetchPrices({})
      .then((result) => {
        if (result?.data) setLivePrices(result.data)
      })
      .catch(() => {
        /* fall back to hardcoded prices */
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnonymous])

  const { execute: redeemCode, isPending: isRedeeming } = useCloudFunction<
    { code: string },
    { premiumExpiresAt: string }
  >('redeemPromoCode')

  const { execute: createCheckout, isPending } = useCloudFunction<
    {
      planType: PlanType
      billingPeriod: BillingPeriod
      successUrl: string
      cancelUrl: string
    },
    { checkoutUrl: string }
  >('createCheckoutSession')

  const plans = planType === 'teacher' ? TEACHER_PLANS : PARENT_PLANS
  const features = planType === 'teacher' ? TEACHER_FEATURES : PARENT_FEATURES

  const handleRedeem = async () => {
    if (!promoCode.trim() || isRedeeming) return
    try {
      await redeemCode({ code: promoCode.trim() })
      showNotification('Code applied! You now have premium access.', 'success')
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid or expired code.'
      showNotification(message, 'error')
    }
  }

  const handleUpgrade = async () => {
    try {
      const result = await createCheckout({
        planType,
        billingPeriod: selectedPeriod,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: window.location.href,
      })
      if (result?.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      }
    } catch {
      showNotification('Unable to start checkout. Please try again.', 'error')
    }
  }

  if (isAnonymous) {
    return (
      <SaveProgressModal
        onClose={onClose}
        preMessage="You'll need a free account first — it takes about 10 seconds."
      />
    )
  }

  return (
    <AppModal open onClose={onClose} title="Upgrade to Premium" maxWidth="sm">
      <Stack spacing={3}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          textAlign="center"
        >
          {planType === 'teacher' ? 'Teacher Plan' : 'Parent Plan'}
        </Typography>

        <Stack spacing={1}>
          {plans.map((plan) => {
            const selected = plan.billingPeriod === selectedPeriod
            const displayPrice =
              livePrices?.[planType]?.[plan.billingPeriod] ?? plan.price
            return (
              <Card
                key={plan.billingPeriod}
                variant="outlined"
                sx={{
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderWidth: selected ? 2 : 1,
                  bgcolor: selected ? 'action.selected' : 'background.paper',
                }}
              >
                <CardActionArea
                  onClick={() => setSelectedPeriod(plan.billingPeriod)}
                  aria-pressed={selected}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography fontWeight={700}>{plan.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {plan.subLabel}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {plan.badge && (
                          <Chip
                            label={plan.badge}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        <Typography fontWeight={800} variant="h6">
                          {displayPrice}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            )
          })}
        </Stack>

        <Stack spacing={0.5}>
          {features.map((feat) => (
            <Stack key={feat} direction="row" spacing={1} alignItems="center">
              <CheckCircleOutline color="success" fontSize="small" />
              <Typography variant="body2">{feat}</Typography>
            </Stack>
          ))}
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleUpgrade}
          disabled={isPending}
        >
          {isPending ? 'Loading…' : 'Get Premium'}
        </Button>

        <Typography variant="caption" color="text.secondary" textAlign="center">
          Secure checkout via Stripe. Cancel anytime.
        </Typography>

        <Divider />

        <Stack spacing={1}>
          <Button
            variant="text"
            size="small"
            startIcon={<CardGiftcard fontSize="small" />}
            onClick={() => setPromoOpen((o) => !o)}
            sx={{ alignSelf: 'center', color: 'text.secondary' }}
          >
            Have a redemption code?
          </Button>

          <Collapse in={promoOpen}>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                inputProps={{ style: { textTransform: 'uppercase' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CardGiftcard fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                onClick={handleRedeem}
                disabled={isRedeeming || !promoCode.trim()}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {isRedeeming ? 'Applying…' : 'Apply'}
              </Button>
            </Stack>
          </Collapse>
        </Stack>
      </Stack>
    </AppModal>
  )
}

export default UpgradeModal
