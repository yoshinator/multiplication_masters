import { type FC, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { v4 as uuidv4 } from 'uuid'

import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

import type {
  SceneTheme,
  SceneItemDefinition,
  SceneItemCategory,
} from '../../constants/sceneDefinitions'
import { SCENES } from '../../constants/sceneDefinitions'
import type Konva from 'konva'

// ---------------------------
// Scene Object Instance Type
// ---------------------------
export type SceneObjectInstance = {
  id: string // instance ID for the placed object
  itemId: string // refers to SceneItemDefinition.id
  x: number
  y: number
  scale: number
  rotation: number
  z: number
}

// ---------------------------
// Props
// ---------------------------
type SceneBuilderProps = {
  theme: SceneTheme
  unlockedItemIds: string[]

  initialObjects?: SceneObjectInstance[]
  onLayoutChange?: (objects: SceneObjectInstance[]) => void
}

// ---------------------------
// Draggable Item Component
// ---------------------------
const DraggableSceneItem: FC<{
  instance: SceneObjectInstance
  definition: SceneItemDefinition
  isSelected: boolean
  onSelect: () => void
  onChange: (next: SceneObjectInstance) => void
}> = ({ instance, definition, isSelected, onSelect, onChange }) => {
  const [image] = useImage(definition.image)

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
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.4 : 0}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...instance,
          x: e.target.x(),
          y: e.target.y(),
        })
      }}
    />
  )
}

// ---------------------------
// Main Scene Builder
// ---------------------------
export const SceneBuilder: FC<SceneBuilderProps> = ({
  theme,
  unlockedItemIds,
  initialObjects = [],
  onLayoutChange,
}) => {
  const sceneDef = SCENES[theme]

  const stageRef = useRef<Konva.Stage>(null)
  const [objects, setObjects] = useState<SceneObjectInstance[]>(initialObjects)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Track open/closed palette categories
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        sceneDef.categories.map((cat) => [cat.id, true]) // all open by default
      )
  )

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  // Items unlocked for this scene
  const unlockedCategories: SceneItemCategory[] = useMemo(() => {
    return sceneDef.categories.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => unlockedItemIds.includes(item.id)),
    }))
  }, [sceneDef.categories, unlockedItemIds])

  const setSortedObjects = (next: SceneObjectInstance[]) => {
    const sorted = [...next]
      .sort((a, b) => a.z - b.z)
      .map((obj, index) => ({ ...obj, z: index }))
    setObjects(sorted)
    onLayoutChange?.(sorted)
  }

  const addObject = (item: SceneItemDefinition) => {
    const instance: SceneObjectInstance = {
      id: uuidv4(),
      itemId: item.id,
      x: 200,
      y: 200,
      scale: item.defaultScale ?? 1,
      rotation: 0,
      z: objects.length,
    }
    const next = [...objects, instance]
    setSortedObjects(next)
    setSelectedId(instance.id)
  }

  const updateObject = (updated: SceneObjectInstance) => {
    const next = objects.map((o) => (o.id === updated.id ? updated : o))
    setSortedObjects(next)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    const next = objects.filter((o) => o.id !== selectedId)
    setSortedObjects(next)
    setSelectedId(null)
  }

  const clearAll = () => {
    setSortedObjects([])
    setSelectedId(null)
  }

  const handleBringToFront = () => {
    if (!selectedId || objects.length === 0) return
    const maxZ = Math.max(...objects.map((o) => o.z))
    const next = objects.map((o) => {
      if (o.id === selectedId) return { ...o, z: maxZ + 1 }
      return o
    })

    setSortedObjects(next)
  }
  const handleSendToBack = () => {
    if (!selectedId || objects.length === 0) return
    const minZ = Math.min(...objects.map((o) => o.z))
    const next = objects.map((o) => {
      if (o.id === selectedId) return { ...o, z: minZ - 1 }
      return o
    })

    setSortedObjects(next)
  }

  const handleBringForward = () => {
    if (!selectedId) return

    const sorted = [...objects].sort((a, b) => a.z - b.z)
    const index = sorted.findIndex((o) => o.id === selectedId)

    if (index < sorted.length - 1) {
      const temp = sorted[index]
      sorted[index] = sorted[index + 1]
      sorted[index + 1] = temp
    }

    // normalize
    const next = sorted.map((o, i) => ({ ...o, z: i }))
    setSortedObjects(next)
  }

  const handleSendBackward = () => {
    if (!selectedId) return

    const sorted = [...objects].sort((a, b) => a.z - b.z)
    const index = sorted.findIndex((o) => o.id === selectedId)

    if (index > 0) {
      const temp = sorted[index]
      sorted[index] = sorted[index - 1]
      sorted[index - 1] = temp
    }

    const next = sorted.map((o, i) => ({ ...o, z: i }))
    setSortedObjects(next)
  }

  // Export image (later: upload to Firebase Storage → save user profile backgroundUrl)
  const exportImage = () => {
    const uri = stageRef.current?.toDataURL()
    const win = window.open()
    if (win) {
      win.document.write(
        `<iframe src="${uri}" frameborder="0" style="width:100%;height:100%;"></iframe>`
      )
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* LEFT PALETTE */}
      <Box
        sx={{
          width: 260,
          borderRight: 1,
          borderColor: 'divider',
          p: 2,
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {sceneDef.label} Builder
        </Typography>

        {unlockedCategories.every((c) => c.items.length === 0) && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Keep practicing to unlock items!
          </Typography>
        )}

        {/* Categories */}
        {unlockedCategories.map((cat) =>
          cat.items.length === 0 ? null : (
            <Box key={cat.id} sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">{cat.label}</Typography>
                <IconButton size="small" onClick={() => toggleCategory(cat.id)}>
                  {openCategories[cat.id] ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
              </Stack>

              <Collapse in={openCategories[cat.id]}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {cat.items.map((item) => (
                    <Button
                      key={item.id}
                      variant="outlined"
                      size="small"
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                      }}
                      onClick={() => addObject(item)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          )
        )}

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Selected Item</Typography>

          {selectedId && (
            <>
              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2">Transform</Typography>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const obj = objects.find((o) => o.id === selectedId)
                    if (!obj) return
                    updateObject({ ...obj, scale: obj.scale + 0.1 })
                  }}
                >
                  Zoom +
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const obj = objects.find((o) => o.id === selectedId)
                    if (!obj) return
                    updateObject({
                      ...obj,
                      scale: Math.max(0.1, obj.scale - 0.1),
                    })
                  }}
                >
                  Zoom –
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const obj = objects.find((o) => o.id === selectedId)
                    if (!obj) return
                    updateObject({ ...obj, rotation: obj.rotation - 15 })
                  }}
                >
                  ⟲ Rotate
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const obj = objects.find((o) => o.id === selectedId)
                    if (!obj) return
                    updateObject({ ...obj, rotation: obj.rotation + 15 })
                  }}
                >
                  ⟳ Rotate
                </Button>
              </Stack>
            </>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={!selectedId}
              onClick={handleBringForward}
            >
              Bring Forward
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={!selectedId}
              onClick={handleSendBackward}
            >
              Send Backward
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={!selectedId}
              onClick={handleBringToFront}
            >
              Bring to Front
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={!selectedId}
              onClick={handleSendToBack}
            >
              Send to Back
            </Button>

            <Button
              variant="contained"
              size="small"
              disabled={!selectedId}
              onClick={deleteSelected}
            >
              Remove
            </Button>

            <Button
              variant="outlined"
              size="small"
              disabled={objects.length === 0}
              onClick={clearAll}
            >
              Clear All
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2">Export</Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={objects.length === 0}
            onClick={exportImage}
          >
            Preview as Image
          </Button>
        </Stack>
      </Box>

      {/* RIGHT CANVAS */}
      <Box
        sx={{
          flex: 1,
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
            width={700}
            height={450}
            style={{ background: sceneDef.backgroundColor }}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null)
            }}
          >
            <Layer>
              {objects.map((obj) => {
                const def =
                  sceneDef.categories
                    .flatMap((c) => c.items)
                    .find((i) => i.id === obj.itemId) || null
                if (!def) return null

                return (
                  <DraggableSceneItem
                    key={obj.id}
                    instance={obj}
                    definition={def}
                    isSelected={selectedId === obj.id}
                    onSelect={() => setSelectedId(obj.id)}
                    onChange={updateObject}
                  />
                )
              })}
            </Layer>
          </Stage>
        </Box>
      </Box>
    </Box>
  )
}
