import { useState, type FC } from 'react'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { CheckCircleOutline } from '@mui/icons-material'
import AppModal from '../AppModal/AppModal'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useCloudFunction } from '../../hooks/useCloudFunction'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import type { BillingPeriod, PlanType } from '../../constants/dataModels'

type UpgradeModalProps = {
  onClose: () => void
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
    price: '$9.99',
    subLabel: 'per month',
  },
  {
    billingPeriod: 'yearly',
    label: 'Yearly',
    price: '$99.99',
    subLabel: 'per year',
    badge: 'Save 17%',
  },
  {
    billingPeriod: 'lifetime',
    label: 'Lifetime',
    price: '$150',
    subLabel: 'one-time',
    badge: 'Best value',
  },
]

const TEACHER_PLANS: PlanCard[] = [
  {
    billingPeriod: 'monthly',
    label: 'Monthly',
    price: '$25.00',
    subLabel: 'per month',
  },
  {
    billingPeriod: 'yearly',
    label: 'Yearly',
    price: '$199.99',
    subLabel: 'per year',
    badge: 'Save 33%',
  },
  {
    billingPeriod: 'lifetime',
    label: 'Lifetime',
    price: '$500',
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
  const { showNotification } = useNotification()
  const defaultTab: PlanType =
    user?.userRole === 'teacher' ? 'teacher' : 'parent'
  const [planType, setPlanType] = useState<PlanType>(defaultTab)
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('yearly')

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

  return (
    <AppModal open onClose={onClose} title="Upgrade to Premium" maxWidth="sm">
      <Stack spacing={3}>
        <Tabs
          value={planType}
          onChange={(_e, val) => setPlanType(val as PlanType)}
          variant="fullWidth"
        >
          <Tab label="Parent" value="parent" />
          <Tab label="Teacher" value="teacher" />
        </Tabs>

        <Stack spacing={1}>
          {plans.map((plan) => {
            const selected = plan.billingPeriod === selectedPeriod
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
                          {plan.price}
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
      </Stack>
    </AppModal>
  )
}

export default UpgradeModal
