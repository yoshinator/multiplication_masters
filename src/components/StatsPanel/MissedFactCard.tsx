import { type FC } from 'react'
import { Typography, Chip, Stack, alpha, Box } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useIsMobile } from '../../hooks/useIsMobile'
import FlipCard from '../FlipCard/FlipCard'

interface Props {
  expression?: string
  incorrect: number
  seen: number
  avgResponseTime?: number | null
  answer?: number
}

const MissedFactCard: FC<Props> = ({
  expression,
  incorrect,
  seen,
  avgResponseTime,
  answer,
}) => {
  const isMobile = useIsMobile()
  const showLabels = !isMobile

  return (
    <FlipCard
      ariaLabel={
        expression ? `Flip ${expression} card` : 'Flip missed fact card'
      }
      cardSx={{
        p: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'error.main',
        boxShadow: 'none',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'background.paper'
            : alpha(theme.palette.error.main, 0.05),
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
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
          <Typography variant="h5" fontWeight="800" gutterBottom>
            {expression}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
            useFlexGap
            sx={{ mt: 0.5 }}
          >
            <Chip
              icon={<CloseIcon />}
              label={`${incorrect}${showLabels ? ' incorrect' : ''}`}
              size="small"
              color="error"
              variant="filled"
              sx={{ fontWeight: 'bold', px: 0.5 }}
              title="Times Incorrect"
            />
            <Chip
              icon={<VisibilityIcon />}
              label={`${seen}${showLabels ? ' seen' : ''}`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'text.secondary',
                color: 'text.secondary',
                px: 0.5,
              }}
              title="Times Seen"
            />
            {avgResponseTime !== undefined && avgResponseTime !== null && (
              <Chip
                icon={<AccessTimeIcon />}
                label={`${(avgResponseTime / 1000).toFixed(1)}s${showLabels ? ' avg' : ''}`}
                size="small"
                variant="outlined"
                color="warning"
                title="Avg Response Time"
              />
            )}
          </Stack>
        </>
      }
      back={
        <>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Answer
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            {answer ?? '--'}
          </Typography>
          {expression && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {expression}
              </Typography>
            </Box>
          )}
        </>
      }
    />
  )
}

export default MissedFactCard
