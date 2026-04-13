import { useState, type FC } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import AppModal from '../AppModal/AppModal'
import type { PackKey, UserRole } from '../../constants/dataModels'
import { FREE_PACKS, PACK_LABELS as ONBOARDING_PACK_LABELS } from '../../constants/appConstants'

const ROLE_OPTIONS: Array<{
  value: UserRole
  label: string
  helper: string
}> = [
  {
    value: 'parent',
    label: 'Parent',
    helper: 'Track progress for one or more kids and keep them motivated.',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    helper: 'Support your class with data and differentiated practice.',
  },
  {
    value: 'student',
    label: 'Student',
    helper: 'Jump right into practice with fast, friendly sessions.',
  },
  {
    value: 'adult',
    label: 'Adult Learner',
    helper: 'Build speed and confidence with targeted practice.',
  },
]

type OnboardingModalProps = {
  onComplete: (data: { role: UserRole; defaultPack: PackKey }) => void
}

const OnboardingModal: FC<OnboardingModalProps> = ({ onComplete }) => {
  const [role, setRole] = useState<UserRole | null>(null)
  const [defaultPack, setDefaultPack] = useState<PackKey>(FREE_PACKS[0])

  const handleComplete = () => {
    if (!role || !FREE_PACKS.includes(defaultPack)) return
    onComplete({
      role,
      defaultPack,
    })
  }

  return (
    <AppModal
      open
      onClose={() => null}
      title="Welcome to Multiplication Masters"
      maxWidth="sm"
      disableClose
      hideCloseButton
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Tell us who you are
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pick your role and choose your starting free pack.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {ROLE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={role === option.value ? 'contained' : 'outlined'}
              onClick={() => setRole(option.value)}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                py: 1.5,
                px: 2,
                borderRadius: 2,
              }}
            >
              <Box textAlign="left">
                <Typography sx={{ fontWeight: 700 }}>{option.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.helper}
                </Typography>
              </Box>
            </Button>
          ))}
        </Stack>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Choose your starting pack
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {FREE_PACKS.map((packId) => (
              <Button
                key={packId}
                variant={defaultPack === packId ? 'contained' : 'outlined'}
                onClick={() => setDefaultPack(packId)}
                sx={{ textTransform: 'none', flex: 1 }}
              >
                {ONBOARDING_PACK_LABELS[packId]}
              </Button>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" color="text.secondary">
          You can change packs later in Profile. Premium unlocks additional
          packs.
        </Typography>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="contained" onClick={handleComplete} disabled={!role}>
            Start Session
          </Button>
        </Box>
      </Stack>
    </AppModal>
  )
}

export default OnboardingModal
