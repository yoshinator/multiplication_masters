import { type FC, useMemo } from 'react'
import { Box } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline' // Import icons
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import StatsCard from './StatsCard'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'

type Props = {
  compact?: boolean
}

const StatsPanel: FC<Props> = ({ compact = false }) => {
  const { correctCount, incorrectCount, latestSession } = useReviewSession()
  const { isSessionActive } = useSessionStatusContext()

  const s = latestSession
  const correct = isSessionActive ? correctCount : (s?.correct ?? 0)
  const incorrect = isSessionActive ? incorrectCount : (s?.incorrect ?? 0)
  const total = correctCount + incorrect

  const accuracy = useMemo(() => {
    if (total === 0) return 100
    return Math.round((correct / total) * 100)
  }, [correct, total])

  // The compact prop will now render the three StatsCards
  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1.5, // Reduced gap slightly for compact layout
          alignItems: 'stretch', // Make all cards stretch to the same height
          // Added Box wrapper for visual cohesion with LevelPanel's style
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 1.5,
        }}
      >
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
      </Box>
    )
  }

  // Full version (if needed elsewhere)
  return <div>Full Stats Here</div>
}

export default StatsPanel
