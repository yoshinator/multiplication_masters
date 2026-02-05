import { type FC, useMemo } from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'
import LevelUpAnimation from '../../components/LevelUpAnimation/LevelUpAnimation'
import { SCENE_ITEMS } from '../../constants/sceneDefinitions'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useThresholdAnimation } from '../../hooks/useThresholdAnimation'

const SceneXPDisplay: FC = () => {
  const { user, activeSceneMeta } = useUser()
  const currentXP = activeSceneMeta?.xp ?? 0
  const activeScene = user?.activeScene || 'garden'

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
    2000
  )

  return (
    <Box
      sx={{ width: '100%', mb: 2, textAlign: 'center', position: 'relative' }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Scene XP: <strong>{currentXP}</strong>
      </Typography>

      {nextUnlock ? (
        <Box sx={{ px: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
          />
          <Typography variant="caption" color="text.secondary">
            {xpToNext} XP until next unlock
          </Typography>
        </Box>
      ) : (
        <Typography
          variant="caption"
          color="success.main"
          sx={{ fontWeight: 'bold' }}
        >
          🎉 All items unlocked for this scene!
        </Typography>
      )}

      <LevelUpAnimation
        isVisible={showAnimation}
        title="✨ NEW ITEM UNLOCKED! ✨"
        color="#FFD700"
      />
    </Box>
  )
}

export default SceneXPDisplay
