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

const SessionSummary: FC = () => {
  const { correctCount, incorrectCount, latestSession } = useReviewSession()
  const navigate = useNavigate()

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
    startSession(s?.sessionLength ?? 15)
  }

  const goHome = () => {
    setIsSessionActive(false)
    navigate(ROUTES.HOME)
  }

  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: 'auto',
        mt: 4,
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      {/* Title */}
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        Session Complete!
      </Typography>

      <Typography variant="body1" sx={{ opacity: 0.75, mb: 3 }}>
        Great job! Here's how you did this round.
      </Typography>

      {/* Core Stats Row */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
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
          mb: 3,
        }}
      >
        <SecondaryStatCard
          icon={<AccessTimeIcon />}
          label="Avg Response Time"
          value={avgTime ? `${avgTime.toFixed(2)}s` : '--'}
        />

        <SecondaryStatCard
          icon={<FlashOnIcon />}
          label="Fast Correct"
          value={fastCorrect}
        />

        <SecondaryStatCard
          icon={<SlowMotionVideoIcon />}
          label="Slow Correct"
          value={slowCorrect}
        />
      </Stack>

      {/* Buttons */}
      <Stack spacing={2} sx={{ mt: 3 }}>
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

const SecondaryStatCard: FC<SSCProps> = ({ icon, label, value }) => {
  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Box sx={{ fontSize: 24, mr: 1 }}>{icon}</Box>

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.7, lineHeight: 1 }}>
          {label}
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </Box>
    </Card>
  )
}
