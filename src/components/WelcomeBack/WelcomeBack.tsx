import { type FC, useCallback, useEffect, useRef } from 'react'
import { Box, Card, Typography, Button, Stack } from '@mui/material'

import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { capitalizeFirstLetter } from '../../utilities/stringHelpers'
import CardLoadingSkeleton from '../CardLoadingSkeleton/CardLoadingSkeleton'
import { useModal } from '../../contexts/modalContext/modalContext'
import OnboardingModal from '../Onboarding/OnboardingModal'
import type { GradeLevel, PackKey } from '../../constants/dataModels'

const WelcomeBack: FC = () => {
  const { startSession, isLoading } = useCardSchedulerContext()
  const { user, updateUser } = useUser()
  const isMobile = useIsMobile()
  const { openModal, closeModal } = useModal()
  const onboardingOpenedRef = useRef(false)

  useEffect(() => {
    onboardingOpenedRef.current = false
  }, [user?.uid])

  const getDefaultPackForGrades = (grades: GradeLevel[]): PackKey => {
    if (grades.some((grade) => ['K', '1', '2'].includes(grade))) {
      return 'add_20'
    }
    return 'mul_36'
  }

  const ensureOnboarding = useCallback(() => {
    if (!user || user.onboardingCompleted) return true
    if (!onboardingOpenedRef.current) {
      onboardingOpenedRef.current = true
      openModal(
        <OnboardingModal
          onComplete={({ role, gradeLevels, learnerCount }) => {
            const defaultPack = getDefaultPackForGrades(gradeLevels)
            const starterPacks: PackKey[] = ['add_20', 'mul_36']
            const isPremium = user.subscriptionStatus === 'premium'
            const enabledPacks = Array.from(
              new Set(
                isPremium
                  ? [...(user.enabledPacks ?? []), defaultPack]
                  : [...starterPacks, defaultPack]
              )
            )

            updateUser({
              userRole: role,
              learnerGradeLevels: gradeLevels,
              learnerCount: learnerCount ?? undefined,
              onboardingCompleted: true,
              activePack: defaultPack,
              enabledPacks,
              showTour: true,
            })
            closeModal()
          }}
        />
      )
    }
    return false
  }, [closeModal, openModal, updateUser, user])

  const handleStartSession = async () => {
    if (isLoading) {
      return
    }
    if (!ensureOnboarding()) {
      return
    }
    await startSession()
  }

  useEffect(() => {
    if (!user || user.onboardingCompleted) return
    ensureOnboarding()
  }, [ensureOnboarding, user])

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        px: { sm: 2 },
        mt: { xs: 6, sm: 24 },
      }}
    >
      <Card
        component={isMobile ? Box : Card}
        elevation={isMobile ? undefined : 0}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 560 },
          p: { xs: 0, sm: 4 },

          // Card-only visuals
          borderRadius: { xs: 0, sm: 3 },
          border: { xs: 'none', sm: '1px solid' },
          borderColor: 'divider',
          bgcolor: { xs: 'transparent', sm: 'background.paper' },
          boxShadow: { xs: 'none', sm: undefined },
        }}
      >
        {isLoading ? (
          <CardLoadingSkeleton />
        ) : (
          <Stack spacing={2.25} alignItems="center" textAlign="center">
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, letterSpacing: -0.3 }}
            >
              Welcome {(user?.totalSessions ?? 0) > 0 ? 'back ' : ''}
              {user?.username ? `${capitalizeFirstLetter(user.username)},` : ''}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 440 }}
            >
              Ready for a quick session? We'll mix review + new cards to build
              fast, long-term recall.
            </Typography>

            <Button
              id="start-session-btn"
              onClick={handleStartSession}
              disabled={isLoading}
              variant="contained"
              size="large"
              aria-label="Start session"
              sx={{
                mt: 0.5,
                px: 6,
                py: 1.6,
                fontWeight: 900,
                fontSize: '1.05rem',
                borderRadius: 999,
                textTransform: 'none',
                boxShadow: (theme) => theme.shadows[4],
              }}
            >
              Start Session
            </Button>

            <Typography variant="caption" color="text.secondary">
              Tip: You can change “Cards per Session” in your profile.
            </Typography>
          </Stack>
        )}
      </Card>
    </Box>
  )
}

export default WelcomeBack
