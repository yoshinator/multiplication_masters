import { type FC } from 'react'
import { Box, Divider, Paper } from '@mui/material'

import { SceneBuilderProvider } from './SceneBuilderProvider'
import SceneCanvas from './SceneCanvas'
import SceneLayerControls from './SceneLayerControls'
import SceneTransformControls from './SceneTransformControls'
import ScenePalette from './ScenePalette'

import type { SceneTheme } from '../../constants/sceneDefinitions'
import type { SceneObjectInstance } from './sceneBuilderTypes'

type Props = {
  theme: SceneTheme
  unlockedItemIds: string[]
  initialObjects?: SceneObjectInstance[]
  onLayoutChange?: (objects: SceneObjectInstance[]) => void
}

const SceneBuilder: FC<Props> = ({
  theme,
  unlockedItemIds,
  initialObjects = [],
  onLayoutChange,
}) => {
  return (
    <SceneBuilderProvider
      theme={theme}
      unlockedItemIds={unlockedItemIds}
      initialObjects={initialObjects}
      onLayoutChange={onLayoutChange}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row-reverse' },
          height: '100%',
          gap: 2,
          overflowY: { xs: 'auto', md: 'hidden' },
        }}
      >
        {/* CANVAS */}
        <SceneCanvas />

        {/* PANEL */}
        <Box
          sx={{
            width: { xs: '100%', md: 260 },
            p: 2,
            borderRight: { xs: 0, md: 1 },
            borderTop: { xs: 1, md: 0 },
            borderColor: 'divider',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <ScenePalette />

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
              justifyContent: 'space-between',
            }}
          >
            <SceneTransformControls />

            <SceneLayerControls />
          </Paper>
        </Box>
      </Box>
    </SceneBuilderProvider>
  )
}

export default SceneBuilder
