import { type FC } from 'react'
import { Stage, Layer } from 'react-konva'
import { Box } from '@mui/material'
import { SCENES } from '../../constants/sceneDefinitions'
import { SceneObjectItem } from './SceneObjectItem'
import { useSceneBuilder } from './SceneContext/sceneBuilderContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const SceneCanvas: FC = () => {
  const { theme, objects, stageRef, setSelectedId } = useSceneBuilder()
  const isMobile = useIsMobile()

  const sceneDef = SCENES[theme]

  return (
    <Box
      sx={{
        flex: { xs: 'none', md: 1 },
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 3,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Stage
          ref={stageRef}
          width={isMobile ? 340 : 450}
          height={420}
          style={{ background: sceneDef.backgroundColor }}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null)
          }}
        >
          <Layer>
            {objects.map((obj) => {
              const def = sceneDef.categories
                .flatMap((c) => c.items)
                .find((i) => i.id === obj.itemId)

              if (!def) return null

              return (
                <SceneObjectItem key={obj.id} instance={obj} definition={def} />
              )
            })}
          </Layer>
        </Stage>
      </Box>
    </Box>
  )
}

export default SceneCanvas
