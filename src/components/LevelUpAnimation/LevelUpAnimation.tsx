import { type FC } from 'react'
import { Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface LevelUpAnimationProps {
  isVisible: boolean
  title?: string
  color?: string
}

const LevelUpAnimation: FC<LevelUpAnimationProps> = ({
  isVisible,
  title = '⭐ LEVEL UP! ⭐',
  color = '#FFD700',
}) => {
  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1.2, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            position: 'fixed',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              color: color,
              textShadow: `0 0 20px ${alpha(color, 0.8)}, 0 4px 12px rgba(0,0,0,0.5)`,
              fontWeight: 900,
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default LevelUpAnimation
