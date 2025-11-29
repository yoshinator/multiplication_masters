import { type FC, useMemo } from 'react'
import { Box, Card, Typography, Stack } from '@mui/material'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import {
  CheckCircle,
  Cancel,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  FlashOn,
} from '@mui/icons-material'
import StatsCard from './StatsCard'

const StatsPanel: FC = () => {
  const { correctCount, incorrectCount, latestSession, isSessionActive } =
    useReviewSession()

  const source = isSessionActive ? 'Live Session' : 'Last Session'
  const s = latestSession

  const correct = isSessionActive ? correctCount : (s?.correct ?? 0)
  const incorrect = isSessionActive ? incorrectCount : (s?.incorrect ?? 0)

  const accuracy = useMemo(() => {
    if (correct + incorrect === 0) return 100
    return Math.round((correct / (correct + incorrect)) * 100)
  }, [correct, incorrect])

  const avgTime = isSessionActive ? null : s?.avgResponseTime
  const boxesUp = isSessionActive ? null : s?.boxesAdvanced
  const boxesDown = isSessionActive ? null : s?.boxesRegressed

  return (
    <Box sx={{ mb: 3 }}>
      {/* Session context */}
      <Typography
        variant="subtitle2"
        sx={{ mb: 1, opacity: 0.7, fontWeight: 600, letterSpacing: 0.5 }}
      >
        {source}
      </Typography>

      {/* Main Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <StatsCard
          label="Correct"
          value={correct}
          icon={<CheckCircle color="success" />}
          color="var(--mui-palette-success-main)"
        />
        <StatsCard
          label="Incorrect"
          value={incorrect}
          icon={<Cancel color="error" />}
          color="var(--mui-palette-error-main)"
        />
        <StatsCard
          label="Accuracy"
          value={`${accuracy}%`}
          icon={<EmojiEvents color="warning" />}
          color="var(--mui-palette-warning-main)"
        />
      </Box>

      {/* Extra Metrics (hide during session) */}
      {!isSessionActive && latestSession && (
        <Stack spacing={2}>
          {/* Avg Response Time */}
          <Card sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Response Time
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FlashOn color="primary" />
              <Typography>
                Avg: <b>{avgTime?.toFixed(0)} ms</b>
              </Typography>
            </Box>
          </Card>

          {/* Box Advancements */}
          <Card sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              SRS Movement
            </Typography>

            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                <Typography>
                  Up: <b>{boxesUp}</b>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown color="error" />
                <Typography>
                  Down: <b>{boxesDown}</b>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Stack>
      )}
    </Box>
  )
}

export default StatsPanel
