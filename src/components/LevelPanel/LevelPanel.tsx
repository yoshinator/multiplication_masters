import { type FC, useEffect, useState } from 'react'
import { Box, Card, Typography, LinearProgress } from '@mui/material'
import { EmojiEvents } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../../contexts/user/useUserContext'

interface Props {
  isMastered: boolean | null // value passed from session context AFTER session ends
}

const LevelPanel: FC<Props> = ({ isMastered }) => {
  const { user } = useUser()
  const [showAnimation, setShowAnimation] = useState(false)
  const [localLevel, setLocalLevel] = useState(user?.activeGroup ?? 1)

  // Trigger “Level Up!” animation
  useEffect(() => {
    if (isMastered) {
      // local optimistic UI update
      setLocalLevel((prev: number) => prev + 1)
      setShowAnimation(true)

      const timer = setTimeout(() => setShowAnimation(false), 2400)
      return () => clearTimeout(timer)
    }
  }, [isMastered])

  return (
    <Box sx={{ mb: 2, position: 'relative' }}>
      <Card
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow:
            '0px 6px 20px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)',
          borderLeft: '6px solid #FFD700',
        }}
      >
        <EmojiEvents sx={{ fontSize: 42, color: '#FFD700' }} />

        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
          Level {localLevel}
        </Typography>

        <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
          Master each level to unlock the next!
        </Typography>

        {/* PROGRESS BAR (optional: replace with mastery %) */}
        <LinearProgress
          variant="determinate"
          value={isMastered ? 100 : 0}
          sx={{
            width: '100%',
            mt: 2,
            height: 6,
            borderRadius: 10,
          }}
        />
      </Card>

      {/* 🎉 LEVEL UP ANIMATION (Framer Motion) */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: -60 }}
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
