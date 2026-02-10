import { type FC, useMemo } from 'react'
import { Box, Typography, LinearProgress, Card } from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'
import LevelUpAnimation from '../../components/LevelUpAnimation/LevelUpAnimation'
import { SCENE_ITEMS } from '../../constants/sceneDefinitions'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useThresholdAnimation } from '../../hooks/useThresholdAnimation'

const SceneXPDisplay: FC = () => {
  const { user, activeSceneMeta } = useUser()
  const currentXP = activeSceneMeta?.xp ?? 0
  const activeScene = user?.activeScene || 'garden'
  const isMobile = useIsMobile()

  const nextUnlock = useMemo(() => {
    const remainingItems = SCENE_ITEMS.filter(
      (it) => it.theme === activeScene && (it.unlock ?? 0) > currentXP
    ).sort((a, b) => (a.unlock ?? 0) - (b.unlock ?? 0))

    return remainingItems[0] || null
  }, [activeScene, currentXP])

  const xpToNext = nextUnlock ? (nextUnlock.unlock ?? 0) - currentXP : 0

  const prevUnlockXP = useMemo(() => {
    const unlockedItems = SCENE_ITEMS.filter(
      (it) => it.theme === activeScene && (it.unlock ?? 0) <= currentXP
    ).sort((a, b) => (b.unlock ?? 0) - (a.unlock ?? 0))
    return unlockedItems[0]?.unlock ?? 0
  }, [activeScene, currentXP])

  const denominator = (nextUnlock?.unlock ?? 0) - prevUnlockXP
  const progress =
    nextUnlock && denominator > 0
      ? ((currentXP - prevUnlockXP) / denominator) * 100
      : 100

  const progressPercentage = Math.min(100, Math.max(0, progress))
  const roundedProgressPercentage = Math.round(progressPercentage)

  /**
   * Triggers the "New Item Unlocked" animation using a milestone-based threshold.
   *
   * Logic:
   * 1. prevUnlockXP is the XP requirement of the highest item currently unlocked.
   * 2. When currentXP reaches a new milestone (e.g., 200 XP), prevUnlockXP jumps to 200.
   * 3. useThresholdAnimation compares the previous XP (e.g., 199) against the new
   *    threshold (200). Since 199 < 200 and 200 >= 200, the animation triggers.
   * 4. On the next XP gain (201), the hook sees 200 < 200 is false, preventing
   *    repeated animations for the same milestone.
   */
  const showAnimation = useThresholdAnimation(
    currentXP,
    prevUnlockXP,
    null,
    2000,
    {
      // Prevent firing on initial login/hydration when activeSceneMeta loads.
      enabled: Boolean(activeSceneMeta),
    }
  )

  return (
    <Box
      id="scene-xp-panel"
      sx={{
        position: 'relative',
        width: { xs: '100%', sm: 340 },
        mx: { xs: 0, sm: 'auto' },
        height: '100%',
        my: 1,
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
            <AutoAwesome sx={{ fontSize: 32, color: 'warning.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Scene XP
            </Typography>
          </Box>
        )}

        {nextUnlock ? (
          <>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                mb: { xs: 0.5, sm: 1 },
                fontWeight: { xs: 600, sm: 400 },
              }}
            >
              Scene Progress{' '}
              {isMobile
                ? `· ${roundedProgressPercentage}%`
                : `· ${currentXP} XP`}
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
                  bgcolor: 'warning.main',
                },
              }}
            />

            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                mt: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {roundedProgressPercentage}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {xpToNext} XP until next unlock
              </Typography>
            </Box>
          </>
        ) : (
          <Typography
            variant="caption"
            color="success.main"
            sx={{ fontWeight: 700, mt: isMobile ? 0 : 1 }}
          >
            🎉 All items unlocked for this scene!
          </Typography>
        )}
      </Card>

      <LevelUpAnimation
        isVisible={showAnimation}
        title="✨ NEW ITEM UNLOCKED! ✨"
        color="#FFD700"
      />
    </Box>
  )
}

export default SceneXPDisplay
