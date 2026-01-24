import { type FC } from 'react'
import { Box, IconButton, Stack, Typography, Tooltip } from '@mui/material'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import { useSceneBuilder } from '../SceneContext/sceneBuilderContext'
import { noop } from 'framer-motion'

export const SceneTransformControls: FC = () => {
  const { objects, selectedId, updateObject } = useSceneBuilder()
  const selected = objects.find((o) => o.id === selectedId) || null

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, mb: 1, opacity: 0.8 }}
      >
        Transform
      </Typography>

      {/* ZOOM CONTROLS */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Tooltip title="Zoom In">
          <IconButton
            size="small"
            color="primary"
            disabled={!selected}
            onClick={() =>
              selected
                ? updateObject({ ...selected, scale: selected.scale + 0.1 })
                : noop
            }
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Zoom Out">
          <IconButton
            size="small"
            color="primary"
            disabled={!selected}
            onClick={() =>
              selected
                ? updateObject({
                    ...selected,
                    scale: Math.max(0.1, selected.scale - 0.1),
                  })
                : noop
            }
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ROTATION CONTROLS */}
      <Stack direction="row" spacing={1}>
        <Tooltip title="Rotate Left">
          <IconButton
            size="small"
            color="primary"
            disabled={!selected}
            onClick={() =>
              selected
                ? updateObject({
                    ...selected,
                    rotation: selected.rotation - 15,
                  })
                : noop
            }
          >
            <RotateLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Rotate Right">
          <IconButton
            size="small"
            color="primary"
            disabled={!selected}
            onClick={() =>
              selected
                ? updateObject({
                    ...selected,
                    rotation: selected.rotation + 15,
                  })
                : noop
            }
          >
            <RotateRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  )
}

export default SceneTransformControls
