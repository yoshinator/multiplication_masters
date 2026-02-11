import { type FC, type ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import FlipCard from '../FlipCard/FlipCard'

interface Props {
  icon: ReactElement
  label?: string
  value: string | number
  color: string
}

const DESCRIPTION_BY_LABEL: Record<string, string> = {
  Correct: 'How many questions you answered correctly in this session.',
  Incorrect: 'How many questions you missed in this session.',
  Accuracy: 'Your percent correct for this session.',
  'Total Sessions': 'How many practice sessions you have completed overall.',
  'Total Questions': 'Total number of questions you have answered overall.',
  'Avg Accuracy': 'Your overall accuracy across all questions answered.',
  'Lifetime Correct': 'Total number of correct answers across all time.',
  'Lifetime Incorrect': 'Total number of incorrect answers across all time.',
  'Facts Mastered':
    'Facts you have answered fast and correct a minimum of 8 times in a row.',
  'Due Today': 'Cards that are due now and should be reviewed today.',
  'Due Tomorrow': "Cards due by tomorrow (includes today's due cards as well).",
}

const StatsCard: FC<Props> = ({ icon, label, value, color }) => {
  const description = label ? DESCRIPTION_BY_LABEL[label] : ''

  return (
    <FlipCard
      ariaLabel={label ? `Flip ${label} card` : 'Flip stat card'}
      cardSx={{
        display: 'flex',
        flex: 1,
        minWidth: 75,

        p: { xs: 0.75, sm: 1 },
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',

        // Card behavior only on desktop
        borderRadius: { xs: 0, sm: 2 },
        borderBottom: { xs: 'none', sm: `3px solid ${color}` },
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
        boxShadow: 'none',

        // Hover only where it makes sense
        transition: { sm: 'transform 0.25s ease' },
        '&:hover': {
          transform: { sm: 'translateY(-3px)' },
        },
      }}
      faceSx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      front={
        <>
          <Box sx={{ fontSize: { xs: 22, sm: 24 } }}>{icon}</Box>

          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>

          {label && (
            <Typography
              variant="caption"
              sx={{ opacity: 0.7, lineHeight: 1.2 }}
            >
              {label}
            </Typography>
          )}
        </>
      }
      back={
        <>
          {label && (
            <Typography variant="caption" sx={{ opacity: 0.7, mb: 0.5 }}>
              {label}
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            What it means
          </Typography>
          <Typography
            variant="caption"
            sx={{ opacity: 0.75, lineHeight: 1.2, mt: 0.5 }}
          >
            {description || 'Tap to flip back.'}
          </Typography>
        </>
      }
    />
  )
}

export default StatsCard
