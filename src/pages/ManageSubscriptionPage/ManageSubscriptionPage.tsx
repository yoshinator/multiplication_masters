import { type FC } from 'react'
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useCloudFunction } from '../../hooks/useCloudFunction'
import { useModal } from '../../contexts/modalContext/modalContext'
import UpgradeModal from '../../components/UpgradeModal/UpgradeModal'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { ROUTES } from '../../constants/routeConstants'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'

type CreateBillingPortalResponse = {
  portalUrl: string
}

const ManageSubscriptionPage: FC = () => {
  const navigate = useNavigate()
  const { user, isProfileSession } = useUser()
  const { auth } = useFirebaseContext()
  const { openModal, closeModal } = useModal()
  const { showNotification } = useNotification()
  const isPremium = user?.subscriptionStatus === 'premium'
  const isAnonymous = Boolean(auth?.currentUser?.isAnonymous)
  const hasStripeSubscription = Boolean(user?.stripeSubscriptionId)
  const canOpenBillingPortal =
    !isProfileSession && !isAnonymous && hasStripeSubscription

  const { execute: createBillingPortalSession, isPending: isPortalPending } =
    useCloudFunction<{ returnUrl: string }, CreateBillingPortalResponse>(
      'createBillingPortalSession'
    )

  const openUpgrade = () => {
    openModal(<UpgradeModal onClose={closeModal} />)
  }

  const openBillingPortal = async () => {
    try {
      const result = await createBillingPortalSession({
        returnUrl: `${window.location.origin}${ROUTES.MANAGE_SUBSCRIPTION}`,
      })
      const portalUrl = result?.data?.portalUrl
      if (!portalUrl) {
        showNotification('Unable to open billing portal right now.', 'error')
        return
      }
      window.location.href = portalUrl
    } catch {
      showNotification('Unable to open billing portal right now.', 'error')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, mb: 6 }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Manage Subscription
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Upgrade to premium, change plans, or cancel your subscription.
          </Typography>
        </Box>

        {isProfileSession ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Billing actions are disabled in profile sessions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Switch back to the account owner session to manage billing.
              </Typography>
            </CardContent>
          </Card>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Current plan: {isPremium ? 'Premium' : 'Free'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Premium billing, upgrades, and cancellation are handled securely
                in Stripe.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={openUpgrade}
                  disabled={Boolean(isProfileSession)}
                >
                  {isPremium ? 'View Upgrade Options' : 'Upgrade to Premium'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={openBillingPortal}
                  disabled={!canOpenBillingPortal || isPortalPending}
                >
                  {isPremium ? 'Manage or Cancel in Stripe' : 'Open Billing Portal'}
                </Button>
              </Stack>

              {!canOpenBillingPortal ? (
                <Typography variant="caption" color="text.secondary">
                  Billing portal is available only for signed-in account owners
                  with an active Stripe subscription.
                </Typography>
              ) : null}
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Button variant="text" onClick={() => navigate(ROUTES.PROFILE)}>
            Back to Profile
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}

export default ManageSubscriptionPage
