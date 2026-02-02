import { type FC } from 'react'
import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

interface LevelUpAnimationProps {
  color?: string
  isVisible: boolean
  title?: string
}

const LevelUpAnimation: FC<LevelUpAnimationProps> = ({
  color = '#FFD700',
  isVisible,
  title = '⭐ LEVEL UP! ⭐',
}) => {
  const isMobile = useIsMobile()

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <Box
          animate={{ opacity: 1, scale: isMobile ? 1 : 1.2, y: 0 }}
          component={motion.div}
          exit={{ opacity: 0, scale: isMobile ? 1.2 : 2, y: -50 }}
          initial={{ opacity: 0, scale: isMobile ? 0.3 : 0.5, y: 50 }}
          sx={{
            alignItems: 'center',
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            left: 0,
            pointerEvents: 'none',
            position: 'fixed',
            right: 0,
            top: 0,
            zIndex: 9999,
          }}
          transition={{ damping: 20, stiffness: 200, type: 'spring' }}
        >
          <Typography
            sx={{
              color,
              fontSize: { xs: '1.5rem', sm: '3rem', md: '3.75rem' },
              fontWeight: 900,
              textShadow: `0 0 20px ${alpha(color, 0.8)}, 0 4px 12px rgba(0,0,0,0.5)`,
              whiteSpace: 'nowrap',
            }}
            variant="h2"
          >
            {title}
          </Typography>
        </Box>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default LevelUpAnimation
