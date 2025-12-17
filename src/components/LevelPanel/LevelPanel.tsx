import { type FC, useEffect, useState } from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'
import { EmojiEvents } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useUser } from '../../contexts/user/useUserContext'

const LevelPanel: FC = () => {
  const { percentageMastered } = useReviewSession()
  const { user } = useUser()

  const [showAnimation, setShowAnimation] = useState(false)
  const [localLevel, setLocalLevel] = useState(user?.activeGroup ?? 1)

  // Trigger “Level Up!” animation
  useEffect(() => {
    if (percentageMastered >= 80) {
      setLocalLevel((prev: number) => prev + 1)
      setShowAnimation(true)

      const timer = setTimeout(() => setShowAnimation(false), 2400)
      return () => clearTimeout(timer)
    }
  }, [percentageMastered])
  console.log({ percentageMastered })
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 220 }}>
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <EmojiEvents sx={{ fontSize: 32, color: '#FFD700' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Level {localLevel}
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7, mb: 1 }}>
          Mastery Progress
        </Typography>

        {/* PROGRESS BAR (Now using actual session progress) */}
        <LinearProgress
          variant="determinate"
          value={percentageMastered}
          sx={{
            width: '100%',
            height: 8, // Slightly thicker bar
            borderRadius: 10,
            bgcolor: 'grey.300',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'success.main',
            },
          }}
        />
        <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>
          {percentageMastered}%
        </Typography>
      </Box>
      {/* 🎉 LEVEL UP ANIMATION (Framer Motion) - remains the same, adjusted styling slightly */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: -45 }} // Moved up slightly
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ type: 'spring', stiffness: 180, damping: 12 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '0%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: '#FFD700',
                textShadow: '0 0 8px rgba(255,210,0,0.8)',
                fontWeight: 800,
              }}
            >
              ⭐ LEVEL UP! ⭐
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default LevelPanel
