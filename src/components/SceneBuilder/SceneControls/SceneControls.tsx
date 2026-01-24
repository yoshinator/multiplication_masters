import { type FC } from 'react'
import { Box, Divider, Paper } from '@mui/material'
import SceneLayerControls from './SceneLayerControls'
import ScenePalette from './ScenePalette'
import SceneTransformControls from './SceneTransformControls'
import { useSceneBuilder } from '../SceneContext/sceneBuilderContext'

const SceneControls: FC = () => {
  const { theme, unlockedItemIds, addObject } = useSceneBuilder()
  return (
    <Box
      sx={{
        width: { xs: '100%', md: 450 },
        p: 2,
        borderTop: { xs: 1, md: 0 },
        borderColor: 'divider',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <Box display={{ xs: 'none', md: 'block' }}>
        <ScenePalette
          theme={theme}
          unlockedItemIds={unlockedItemIds}
          addObject={addObject}
        />
      </Box>
      <Divider sx={{ my: 2 }} />

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <SceneTransformControls />

        <SceneLayerControls />
      </Paper>
    </Box>
  )
}

export default SceneControls
