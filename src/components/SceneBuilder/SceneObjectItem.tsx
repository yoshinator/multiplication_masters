import { type FC } from 'react'
import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'

import { type SceneObjectInstance } from './sceneBuilderTypes'
import { type SceneItemDefinition } from '../../constants/sceneDefinitions'
import { useSceneBuilder } from './SceneContext/sceneBuilderContext'

interface Props {
  instance: SceneObjectInstance
  definition: SceneItemDefinition
}

export const SceneObjectItem: FC<Props> = ({ instance, definition }) => {
  const [image] = useImage(definition.image)
  const { updateObject, setSelectedId, selectedId } = useSceneBuilder()
  const isSelected = instance.id === selectedId
  return (
    <KonvaImage
      image={image}
      x={instance.x}
      y={instance.y}
      draggable
      scaleX={instance.scale}
      scaleY={instance.scale}
      rotation={instance.rotation}
      shadowColor={isSelected ? 'black' : undefined}
      shadowBlur={isSelected ? 1 : 0}
      shadowOpacity={isSelected ? 1 : 0}
      onClick={() => setSelectedId(instance.id)}
      onDragStart={() => setSelectedId(instance.id)}
      onTap={() => setSelectedId(instance.id)}
      onDragEnd={(e) => {
        updateObject({
          ...instance,
          x: e.target.x(),
          y: e.target.y(),
        })
      }}
    />
  )
}
