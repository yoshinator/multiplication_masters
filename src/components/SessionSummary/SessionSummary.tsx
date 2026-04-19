import { type FC, type ReactElement, useMemo } from 'react'
import { Box, Button, Typography, Stack, Card, Paper } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo'
import ReplayIcon from '@mui/icons-material/Replay'
import SaveIcon from '@mui/icons-material/Save'

import StatsCard from '../StatsPanel/StatsCard'
import SaveProgressModal from '../Login/SaveProgressModal'

import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useModal } from '../../contexts/modalContext/modalContext'

const SessionSummary: FC = () => {
  const { correctCount, incorrectCount, latestSession } = useReviewSession()
  const isMobile = useIsMobile()

  const { startSession, isLoading } = useCardSchedulerContext()
  const { setIsSessionActive } = useSessionStatusContext()
  const { auth } = useFirebaseContext()
  const { openModal, closeModal } = useModal()

  const isAnonymous = Boolean(auth?.currentUser?.isAnonymous)

  const s = latestSession

  const correct = s?.correct ?? correctCount
  const incorrect = s?.incorrect ?? incorrectCount
  const total = correct + incorrect

  const accuracy = useMemo(() => {
    if (total === 0) return null
    return Math.round((correct / total) * 100)
  }, [correct, total])

  const avgTime = s?.avgResponseTime ?? null
  const fastCorrect = s?.fastCorrect ?? 0
  const slowCorrect = s?.slowCorrect ?? 0

  const restart = async () => {
    if (isLoading) {
      return
    }
    setIsSessionActive(true)
    await startSession()
  }

  return (
    <Card
      id="session-summary-card"
      component={Box}
      elevation={0}
      sx={{
        maxWidth: { xs: '100%', sm: 480 },
        mx: 'auto',
        mt: { xs: 0, sm: 4 },
        p: { xs: 2, sm: 3 },

        borderRadius: { xs: 0, sm: 3 },
        border: { xs: 'none', sm: '1px solid' },
        borderColor: 'divider',
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
        boxShadow: 'none',

        textAlign: 'center',
      }}
    >
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        sx={{ fontWeight: 800, mb: { xs: 1, sm: 2 } }}
      >
        Session Complete!
      </Typography>

      <Typography variant="body2" sx={{ opacity: 0.75, mb: { xs: 2, sm: 3 } }}>
        Great job! Here's how you did this round.
      </Typography>

      {/* Core Stats */}
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
          value={accuracy === null ? '—' : `${accuracy}%`}
          color="primary.main"
        />
      </Stack>

      {/* Secondary Stats */}
      <Stack spacing={1.5} sx={{ mt: 2, mb: { xs: 2, sm: 3 } }}>
        <SecondaryStatRow
          icon={<AccessTimeIcon />}
          label="Avg Response Time"
          value={avgTime ? `${(avgTime / 1000).toFixed(2)} seconds` : '--'}
        />

        <Stack direction={isMobile ? 'row' : 'column'} spacing={1.5}>
          <Box sx={{ flex: 1 }}>
            <SecondaryStatRow
              icon={<FlashOnIcon />}
              label="Fast Correct"
              value={fastCorrect}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SecondaryStatRow
              icon={<SlowMotionVideoIcon />}
              label="Slow Correct"
              value={slowCorrect}
            />
          </Box>
        </Stack>
      </Stack>

      {isAnonymous && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            borderColor: 'warning.main',
            bgcolor: 'warning.50',
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Save your progress!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Your session won't be saved without an account. It's free and takes 10 seconds.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => openModal(<SaveProgressModal onClose={closeModal} />)}
          >
            Create Free Account
          </Button>
        </Paper>
      )}

      {/* Actions */}
      <Stack spacing={2} sx={{ mt: { xs: 1, sm: 2 } }}>
        <Button
          disabled={isLoading}
          id="play-again-btn"
          variant="contained"
          size="large"
          startIcon={<ReplayIcon />}
          onClick={restart}
        >
          Play Again
        </Button>
      </Stack>
    </Card>
  )
}

export default SessionSummary

type SSCProps = {
  icon: ReactElement
  label: string
  value: string | number
}

const SecondaryStatRow: FC<SSCProps> = ({ icon, label, value }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: { xs: 1, sm: 1.5 },

        borderRadius: { xs: 0, sm: 2 },
        border: { xs: 'none', sm: '1px solid' },
        borderColor: 'divider',
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
      }}
    >
      <Box sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }}>{icon}</Box>

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.1 }}>
          {label}
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )
}
