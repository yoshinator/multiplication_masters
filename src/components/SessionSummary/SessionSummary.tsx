import { type FC, useMemo } from 'react'
import { Box, Button, Typography, Stack, Card } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo'
import ReplayIcon from '@mui/icons-material/Replay'
import HomeIcon from '@mui/icons-material/Home'

import StatsCard from '../StatsPanel/StatsCard'

import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useIsMobile } from '../../hooks/useIsMobile'

const SessionSummary: FC = () => {
  const { correctCount, incorrectCount, latestSession } = useReviewSession()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const { startSession } = useCardSchedulerContext()
  const { setIsSessionActive } = useSessionStatusContext()

  const s = latestSession

  // Fallback: If somehow we have no session record, use currentCounts
  const correct = s?.correct ?? correctCount
  const incorrect = s?.incorrect ?? incorrectCount
  const total = correct + incorrect

  const accuracy = useMemo(() => {
    if (total === 0) return 100
    return Math.round((correct / total) * 100)
  }, [correct, total])

  const avgTime = s?.avgResponseTime ?? null
  const fastCorrect = s?.fastCorrect ?? 0
  const slowCorrect = s?.slowCorrect ?? 0

  const restart = () => {
    setIsSessionActive(true)
    startSession()
  }

  const goHome = () => {
    setIsSessionActive(false)
    navigate(ROUTES.HOME)
  }

  return (
    <Box
      sx={{
        maxWidth: isMobile ? '100%' : 480,
        mx: 'auto',
        mt: isMobile ? 1 : 4,
        p: isMobile ? 2 : 3,
        bgcolor: 'background.paper',
        borderRadius: isMobile ? 0 : 3,
        border: isMobile ? 'none' : '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        sx={{ fontWeight: 800, mb: isMobile ? 1 : 2 }}
      >
        Session Complete!
      </Typography>

      <Typography variant="body2" sx={{ opacity: 0.75, mb: isMobile ? 2 : 3 }}>
        Great job! Here's how you did this round.
      </Typography>

      {/* Core Stats Row */}
      <Stack direction="row" spacing={1.5} sx={{ mb: { xs: 1, sm: 2 } }}>
        <StatsCard
          icon={<CheckCircleOutlineIcon color="success" />}
          label="Correct"
          value={correct}
          color="success.main"
        />
        <StatsCard
          icon={<CancelOutlinedIcon color="error" />}
          label="Incorrect"
          value={incorrect}
          color="error.main"
        />
        <StatsCard
          icon={<TrendingUpIcon color="primary" />}
          label="Accuracy"
          value={`${accuracy}%`}
          color="primary.main"
        />
      </Stack>

      {/* Additional Stats */}
      <Stack
        spacing={1.5}
        sx={{
          mt: 2,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <SecondaryStatCard
          icon={<AccessTimeIcon />}
          isMobile={isMobile}
          label="Avg Response Time"
          value={avgTime ? `${(avgTime / 1000).toFixed(2)} seconds` : '--'}
        />

        <SecondaryStatCard
          isMobile={isMobile}
          icon={<FlashOnIcon />}
          label="Fast Correct"
          value={fastCorrect}
        />

        <SecondaryStatCard
          isMobile={isMobile}
          icon={<SlowMotionVideoIcon />}
          label="Slow Correct"
          value={slowCorrect}
        />
      </Stack>

      {/* Buttons */}
      <Stack spacing={2} sx={{ mt: { xs: 1, sm: 3 } }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<ReplayIcon />}
          onClick={restart}
        >
          Restart Session
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<HomeIcon />}
          onClick={goHome}
        >
          Back to Home
        </Button>
      </Stack>
    </Box>
  )
}

export default SessionSummary

// Helper Card Component
type SSCProps = {
  icon: React.ReactElement
  label: string
  value: string | number
}

const SecondaryStatCard: FC<SSCProps & { isMobile?: boolean }> = ({
  icon,
  label,
  value,
  isMobile,
}) => {
  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: isMobile ? 1 : 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Box sx={{ fontSize: isMobile ? 20 : 24, mr: 1 }}>{icon}</Box>

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.1 }}>
          {label}
        </Typography>

        <Typography
          variant={isMobile ? 'subtitle1' : 'h6'}
          sx={{ fontWeight: 700 }}
        >
          {value}
        </Typography>
      </Box>
    </Card>
  )
}
