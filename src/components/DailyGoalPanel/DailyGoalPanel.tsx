import { type FC } from 'react'
import { Typography, LinearProgress } from '@mui/material'
import { TrackChanges } from '@mui/icons-material'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useDailyReviews } from '../../hooks/useDailyReviews'
import { useIsMobile } from '../../hooks/useIsMobile'
import LevelUpAnimation from '../LevelUpAnimation/LevelUpAnimation'
import { useThresholdAnimation } from '../../hooks/useThresholdAnimation'
import PanelCard from '../PanelCard/PanelCard'

export const DailyGoalPanel: FC = () => {
  const { user, activeProfileId } = useUser()
  const reviewsToday = useDailyReviews(user?.uid, activeProfileId)
  const isMobile = useIsMobile()
  /**
   * because the steady state of the application at 10 cards per
   * day is about 8x or reviews for 10 new cards. This makes the daily goal achievable
   */
  const dailyGoal = 60

  const progressPercentage = Math.min(100, (reviewsToday / dailyGoal) * 100)
  const isGoalMet = reviewsToday >= dailyGoal

  // If reviewsToday is 0 (or loading), we pass dailyGoal to the animation hook
  // to prevent it from triggering when the value jumps from 0 to the actual value.
  const animationValue = !reviewsToday ? dailyGoal : reviewsToday
  const showAnimation = useThresholdAnimation(animationValue, dailyGoal)

  const roundedProgressPercentage = Math.round(progressPercentage)

  return (
    <PanelCard
      id="daily-goal-panel"
      title="Daily Goal"
      icon={
        <TrackChanges
          sx={{
            fontSize: 32,
            color: isGoalMet ? '#4CAF50' : '#2196F3',
          }}
        />
      }
      overlay={
        <LevelUpAnimation
          isVisible={showAnimation}
          title="🎯 DAILY GOAL REACHED! 🎯"
          color="#4CAF50"
        />
      }
    >
      <Typography
        variant="caption"
        sx={{
          opacity: 0.7,
          mb: { xs: 0.5, sm: 1 },
          fontWeight: { xs: 600, sm: 400 },
        }}
      >
        {isGoalMet ? 'Goal Reached!' : 'Daily Progress'}{' '}
        {isMobile && `· ${roundedProgressPercentage}%`}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progressPercentage}
        sx={{
          width: '100%',
          height: 8,
          borderRadius: 10,
          bgcolor: 'grey.300',
          '& .MuiLinearProgress-bar': {
            bgcolor: isGoalMet ? 'success.main' : 'primary.main',
          },
        }}
      />

      <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>
        {roundedProgressPercentage}%
      </Typography>
    </PanelCard>
  )
}
