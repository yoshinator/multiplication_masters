import { type FC } from 'react'
import { Box } from '@mui/material'

import { SceneBuilderProvider } from './SceneContext/SceneBuilderProvider'
import SceneCanvas from './SceneCanvas'

import type { SceneTheme } from '../../constants/sceneDefinitions'
import type { SceneObjectInstance } from './sceneBuilderTypes'
import SceneControls from './SceneControls/SceneControls'

type Props = {
  sceneId?: string
  theme: SceneTheme
  unlockedItemIds: string[]
  initialObjects?: SceneObjectInstance[]
  initialBackgroundId?: string
  initialThumbnailUrl?: string
  initialName?: string
  onLayoutChange?: (objects: SceneObjectInstance[]) => void
}

const SceneBuilder: FC<Props> = ({
  sceneId,
  theme,
  unlockedItemIds,
  initialObjects = [],
  initialBackgroundId,
  initialThumbnailUrl,
  initialName,
  onLayoutChange,
}) => {
  return (
    <SceneBuilderProvider
      sceneId={sceneId}
      theme={theme}
      unlockedItemIds={unlockedItemIds}
      initialObjects={initialObjects}
      initialBackgroundId={initialBackgroundId}
      initialThumbnailUrl={initialThumbnailUrl}
      initialName={initialName}
      onLayoutChange={onLayoutChange}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row-reverse' },
          mb: { xs: 3, md: 0 },
          height: '100%',
          gap: 2,
          overflowY: { xs: 'auto', md: 'hidden' },
        }}
      >
        {/* CANVAS */}
        <SceneCanvas />

        {/* PANEL */}
        <SceneControls />
      </Box>
    </SceneBuilderProvider>
  )
}

export default SceneBuilder
