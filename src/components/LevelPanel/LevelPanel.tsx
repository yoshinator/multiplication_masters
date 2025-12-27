import { type FC } from 'react'
import { Box, Typography, LinearProgress, Card } from '@mui/material'
import { EmojiEvents } from '@mui/icons-material'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useLevelUp } from '../../hooks/useLevelUp'
import LevelUpAnimation from '../LevelUpAnimation/LevelUpAnimation'

const LevelPanel: FC = () => {
  const { percentageMastered } = useReviewSession()
  const { user } = useUser()
  const isMobile = useIsMobile()

  const { showAnimation, localLevel } = useLevelUp(
    percentageMastered,
    80,
    user?.activeGroup ?? 1
  )

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
      <LevelUpAnimation
        isVisible={showAnimation}
        title="⭐ LEVEL UP! ⭐"
        color="#FFD700"
      />
    </Box>
  )
}

export default LevelPanel
