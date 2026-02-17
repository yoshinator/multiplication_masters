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
    <Box>
      <Typography sx={{ mb: 1 }} variant="subtitle2">
        Active Scene
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Choose the default scene shown during practice.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.25,
        }}
      >
        {Object.values(SCENES).map((scene) => {
          const isComingSoon = scene.id === 'garage'
          const isLocked = (user?.lifetimeCorrect ?? 0) < (scene.unlock ?? 0)
          const isSelected = user?.activeScene === scene.id
          const bgImage = SCENE_ITEMS.find(
            (it) => it.theme === scene.id && it.tab === 'background'
          )?.image
          const isDisabled = isComingSoon || isLocked

          return (
            <Box
              key={scene.id}
              component="div"
              role="button"
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => !isDisabled && selectScene(scene.id)}
              onKeyDown={(e) => !isDisabled && handleChoiceKeyDown(e)}
              sx={{
                ...getOptionButtonStyle(isSelected),
                position: 'relative',
                overflow: 'hidden',
                opacity: isDisabled ? 0.6 : 1,
                filter: isDisabled ? 'grayscale(1)' : 'none',
                cursor: isDisabled ? 'default' : 'pointer',
                aspectRatio: { xs: '4 / 3', sm: '16 / 10' },
                minHeight: { xs: 110, sm: 140 },
                p: 0,
              }}
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
                {isComingSoon ? (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.65rem', opacity: 0.9 }}
                  >
                    Coming soon
                  </Typography>
                ) : isLocked ? (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.65rem', opacity: 0.9 }}
                  >
                    {scene.unlock} correct
                  </Typography>
                ) : null}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default SceneThemeSelect
