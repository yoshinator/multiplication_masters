import type { FC, KeyboardEvent } from 'react'
import { Box, Typography, type BoxProps } from '@mui/material'
import { SCENES, SCENE_ITEMS } from '../../constants/sceneDefinitions'
import { useUser } from '../../contexts/userContext/useUserContext'

interface Props {
  handleChoiceKeyDown: (e: KeyboardEvent<HTMLElement>) => void
  getOptionButtonStyle: (selected: boolean) => BoxProps['sx']
}

const SceneThemeSelect: FC<Props> = ({
  handleChoiceKeyDown,
  getOptionButtonStyle,
}) => {
  const { user, selectScene } = useUser()
  return (
    <Box sx={{ mt: 4 }}>
      <Typography sx={{ mb: 1 }} variant="subtitle2">
        Active Scene
      </Typography>
      {/* put sx styles in the theme. Use on ProfilePage. GRID_CONTAINER_STYLE */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
          },
          gap: 1,
        }}
      >
        {Object.values(SCENES).map((scene) => {
          const isLocked = (user?.lifetimeCorrect ?? 0) < (scene.unlock ?? 0)
          const isSelected = user?.activeScene === scene.id
          const bgImage = SCENE_ITEMS.find(
            (it) => it.theme === scene.id && it.tab === 'background'
          )?.image

          return (
            <Box
              key={scene.id}
              component="div"
              role="button"
              aria-disabled={isLocked}
              tabIndex={isLocked ? -1 : 0}
              onClick={() => !isLocked && selectScene(scene.id)}
              onKeyDown={(e) => !isLocked && handleChoiceKeyDown(e)}
              sx={[
                getOptionButtonStyle(isSelected),
                {
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isLocked ? 0.6 : 1,
                  filter: isLocked ? 'grayscale(1)' : 'none',
                  cursor: isLocked ? 'default' : 'pointer',
                  minHeight: 100,
                  p: 0,
                },
              ]}
            >
              {bgImage && (
                <Box
                  component="img"
                  src={bgImage}
                  alt={scene.label}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                  }}
                />
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  p: 0.5,
                  textAlign: 'center',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, display: 'block' }}
                >
                  {scene.label}
                </Typography>
                {isLocked && (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.65rem', opacity: 0.9 }}
                  >
                    {scene.unlock} correct
                  </Typography>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default SceneThemeSelect
