import { type FC, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'

type Props = {
  compact?: boolean
}

const circleStyle = (color: string) => ({
  width: 70,
  height: 70,
  borderRadius: '50%',
  border: `3px solid ${color}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 700,
})

const StatsPanel: FC<Props> = ({ compact = false }) => {
  const { correctCount, incorrectCount, latestSession, isSessionActive } =
    useReviewSession()

  const s = latestSession
  const correct = isSessionActive ? correctCount : (s?.correct ?? 0)
  const incorrect = isSessionActive ? incorrectCount : (s?.incorrect ?? 0)

  const accuracy = useMemo(() => {
    if (correct + incorrect === 0) return 100
    return Math.round((correct / (correct + incorrect)) * 100)
  }, [correct, incorrect])

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box sx={circleStyle('#00c853')}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            OK
          </Typography>
          <Typography>{correct}</Typography>
        </Box>

        <Box sx={circleStyle('#d50000')}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Miss
          </Typography>
          <Typography>{incorrect}</Typography>
        </Box>

        <Box sx={circleStyle('#ffab00')}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Acc
          </Typography>
          <Typography>{accuracy}%</Typography>
        </Box>
      </Box>
    )
  }

  // Full version (if needed elsewhere)
  return <div>Full Stats Here</div>
}

export default StatsPanel
