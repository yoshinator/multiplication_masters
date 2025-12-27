import { type FC, useEffect, useRef, useState } from 'react'
import { Box, Typography, LinearProgress, Card } from '@mui/material'
import { EmojiEvents } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const THRESHOLD = 80

const LevelPanel: FC = () => {
  const { percentageMastered } = useReviewSession()
  const { user } = useUser()
  const isMobile = useIsMobile()

  const [showAnimation, setShowAnimation] = useState(false)
  const [localLevel, setLocalLevel] = useState(user?.activeGroup ?? 1)
  const prevPercentRef = useRef<number>(percentageMastered)

  // Trigger “Level Up!” animation once when threshold is crossed
  useEffect(() => {
    const prevPercentage = prevPercentRef.current
    const crossedThresholdOnce =
      prevPercentage < THRESHOLD && percentageMastered >= THRESHOLD

    prevPercentRef.current = percentageMastered

    if (!crossedThresholdOnce) return

    setLocalLevel((prev) => prev + 1)
    setShowAnimation(true)

    const timer = setTimeout(() => setShowAnimation(false), 2400)
    return () => clearTimeout(timer)
  }, [percentageMastered])

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
        {!isMobile && (
          <Box display="flex" alignItems="center" gap={1}>
            <EmojiEvents sx={{ fontSize: 32, color: '#FFD700' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Level {localLevel}
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
          Mastery Progress {isMobile && `· Level ${localLevel} 🏆`}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={percentageMastered}
          sx={{
            width: '100%',
            height: 8,
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
      </Card>

      {/* LEVEL UP ANIMATION */}
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
