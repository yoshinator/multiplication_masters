import { type FC } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { Box } from '@mui/material'
import { SCENE_ITEM_BY_ID, SCENES } from '../../constants/sceneDefinitions'
import { SceneObjectItem } from './SceneObjectItem'
import { useSceneBuilder } from './SceneContext/sceneBuilderContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const SceneBackground: FC<{
  itemId: string
  width: number
  height: number
}> = ({ itemId, width, height }) => {
  const def = SCENE_ITEM_BY_ID[itemId]
  const [image] = useImage(def?.image || '')

  if (!image) return null

  // "Cover" logic: fill the stage while maintaining aspect ratio
  const scale =
    image.width > 0 && image.height > 0
      ? Math.max(width / image.width, height / image.height)
      : 1
  const imgWidth = image.width * scale
  const imgHeight = image.height * scale

  // Center the image
  const x = (width - imgWidth) / 2
  const y = (height - imgHeight) / 2

  return (
    <KonvaImage
      image={image}
      width={imgWidth}
      height={imgHeight}
      x={x}
      y={y}
      listening={false}
    />
  )
}

const SceneCanvas: FC = () => {
  const { theme, objects, stageRef, setSelectedId, backgroundId } =
    useSceneBuilder()
  const isMobile = useIsMobile()

  const sceneDef = SCENES[theme]
  const width = isMobile ? 340 : 450
  const height = 420

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
          width={width}
          height={height}
          style={{ background: sceneDef.backgroundColor }}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null)
          }}
        >
          <Layer>
            {backgroundId && (
              <SceneBackground
                itemId={backgroundId}
                width={width}
                height={height}
              />
            )}
            {objects.map((obj) => {
              const def = SCENE_ITEM_BY_ID[obj.itemId]
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
