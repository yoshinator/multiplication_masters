import { type FC, useMemo, useState, useEffect, useRef } from 'react'
import { Box, Typography, LinearProgress, Card } from '@mui/material'
import { TrackChanges } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useDailyReviews } from '../../hooks/useDailyReviews'
import { useIsMobile } from '../../hooks/useIsMobile'

const GOAL_CONFIG = {
  BEGINNER: 150, // Group 1
  ADVANCED: 120, // Group 2+
}

export const DailyGoalPanel: FC = () => {
  const { user } = useUser()
  const reviewsToday = useDailyReviews(user?.uid)
  const isMobile = useIsMobile()
  const [showAnimation, setShowAnimation] = useState(false)
  const prevReviewsRef = useRef(reviewsToday)

  const dailyGoal = useMemo(() => {
    if (!user) return GOAL_CONFIG.BEGINNER

    const group = user.activeGroup ?? 1

    return group <= 2 ? GOAL_CONFIG.BEGINNER : GOAL_CONFIG.ADVANCED
  }, [user])

  const progressPercentage = Math.min(100, (reviewsToday / dailyGoal) * 100)
  const isGoalMet = reviewsToday >= dailyGoal

  useEffect(() => {
    const prevReviews = prevReviewsRef.current
    // Trigger animation if we just crossed the goal
    if (prevReviews < dailyGoal && reviewsToday >= dailyGoal) {
      setShowAnimation(true)
      const timer = setTimeout(() => setShowAnimation(false), 3000)
      return () => clearTimeout(timer)
    }
    prevReviewsRef.current = reviewsToday
  }, [reviewsToday, dailyGoal])

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '100%', sm: 340 },
        mx: { xs: 0, sm: 'auto' },
        height: '100%',
      }}
    >
      <Card
        component={isMobile ? Box : Card}
        elevation={0}
        sx={{
          height: '100%',
          p: { xs: 2, sm: 2.5 },
          pb: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 2 },
          border: { xs: 'none', sm: '1px solid' },
          borderColor: 'divider',
          bgcolor: { xs: 'transparent', sm: 'background.paper' },
          boxShadow: { xs: 'none', sm: 'inherit' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
        }}
      >
        {(() => {
          const roundedProgressPercentage = Math.round(progressPercentage)

          return (
            <>
              {!isMobile && (
                <Box display="flex" alignItems="center" gap={1}>
                  <TrackChanges
                    sx={{
                      fontSize: 32,
                      color: isGoalMet ? '#4CAF50' : '#2196F3',
                    }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Daily Goal
                  </Typography>
                </Box>
              )}

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

              <Typography
                variant="caption"
                sx={{ mt: 0.5, fontWeight: 600 }}
              >
                {roundedProgressPercentage}%
              </Typography>
            </>
          )
        })()}
      </Card>

      {/* GOAL MET ANIMATION */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.1, y: -30 }}
            animate={{ opacity: 1, scale: 0.4, y: -45 }}
            exit={{ opacity: 0, scale: 0.2, y: -20 }}
            transition={{ type: 'spring', stiffness: 180, damping: 12 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 20,
              width: 'max-content',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: '#4CAF50',
                textShadow: '0 0 8px rgba(76, 175, 80, 0.8)',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              🎯 GOAL MET! 🎯
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
