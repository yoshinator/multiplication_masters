import { Box, Typography } from '@mui/material'
import type { FC } from 'react'
import type { UserProfile } from '../../../constants/dataModels'
import ProfileSectionCard from './ProfileSectionCard'
import { formatProfileGrade } from './profileConstants'

type LearnerProfilesSectionProps = {
  profiles: UserProfile[]
  activeProfileId: string | null
  onSelectProfile: (profileId: string) => void
}

const LearnerProfilesSection: FC<LearnerProfilesSectionProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
}) => {
  return (
    <ProfileSectionCard>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Learner Profiles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select which learner profile is active for this device.
      </Typography>

      <Box
        role="group"
        aria-label="Learner profiles"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {profiles.map((profileItem) => {
          const selected = activeProfileId === profileItem.id
          return (
            <Box
              key={profileItem.id}
              component="button"
              type="button"
              onClick={() => onSelectProfile(profileItem.id)}
              sx={{
                textAlign: 'left',
                px: 2,
                py: 1.75,
                borderRadius: 2,
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.light' : 'background.default',
                color: selected ? 'primary.contrastText' : 'inherit',
                display: 'grid',
                gap: 0.5,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: selected ? 'primary.main' : 'text.primary',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {profileItem.displayName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {formatProfileGrade(profileItem.gradeLevel)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Sign-in: {profileItem.loginName}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </ProfileSectionCard>
  )
}

export default LearnerProfilesSection
