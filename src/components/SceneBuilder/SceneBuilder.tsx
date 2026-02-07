import { type FC } from 'react'
import { Box } from '@mui/material'

import { SceneBuilderProvider } from './SceneContext/SceneBuilderProvider'
import SceneCanvas from './SceneCanvas'

import type { SceneObjectInstance } from './sceneBuilderTypes'
import SceneControls from './SceneControls/SceneControls'
import type { SavedScene } from '../../constants/dataModels'

type Props = {
  sceneId?: string
  onLayoutChange?: (objects: SceneObjectInstance[]) => void
  savedScene?: SavedScene | null
}

const SceneBuilder: FC<Props> = ({ sceneId, onLayoutChange, savedScene }) => {
  return (
    <SceneBuilderProvider
      sceneId={sceneId}
      onLayoutChange={onLayoutChange}
      savedScene={savedScene}
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
