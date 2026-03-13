import { Box, Button, Stack, Typography } from '@mui/material'
import type { FC } from 'react'
import ProfileSectionCard from './ProfileSectionCard'

type ProfileHeaderSectionProps = {
  title: string
  canEnablePinSignIn: boolean
  hasPinSignIn: boolean
  isAnonymous: boolean
  showReturnToOwner?: boolean
  showAddLearner?: boolean
  onAddLearner: () => void
  onEnablePin: () => void
  onSaveProgress: () => void
  onReturnToOwner?: () => void
}

const ProfileHeaderSection: FC<ProfileHeaderSectionProps> = ({
  title,
  canEnablePinSignIn,
  hasPinSignIn,
  isAnonymous,
  showReturnToOwner = false,
  showAddLearner = false,
  onAddLearner,
  onEnablePin,
  onSaveProgress,
  onReturnToOwner,
}) => {
  return (
    <ProfileSectionCard
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Update your learner setup, session defaults, and account preferences.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        {showReturnToOwner ? (
          <Button variant="outlined" onClick={onReturnToOwner}>
            Back to my profile
          </Button>
        ) : null}
        {showAddLearner ? (
          <Button variant="contained" onClick={onAddLearner}>
            Add learner
          </Button>
        ) : null}

        {canEnablePinSignIn && !hasPinSignIn ? (
          <Button variant="outlined" onClick={onEnablePin}>
            Enable profile PIN sign-in
          </Button>
        ) : null}

        {isAnonymous ? (
          <Button variant="outlined" color="warning" onClick={onSaveProgress}>
            Save Progress (Sign Up)
          </Button>
        ) : null}
      </Stack>
    </ProfileSectionCard>
  )
}

export default ProfileHeaderSection
