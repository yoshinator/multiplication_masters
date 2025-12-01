import { type FC } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material'

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import DeleteIcon from '@mui/icons-material/Delete'
import ClearAllIcon from '@mui/icons-material/ClearAll'

import { useSceneBuilder } from './sceneBuilderContext'

const SceneLayerControls: FC = () => {
  const {
    selectedId,
    bringForward,
    bringToFront,
    sendBackward,
    sendToBack,
    deleteSelected,
    clearAll,
    objects,
  } = useSceneBuilder()

  const disabled = !selectedId

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, mb: 1, opacity: 0.8 }}
      >
        Layers
      </Typography>

      <Box display="flex" alignItems="flex-start">
        {/* LEFT — movement controls */}
        <Box>
          {/* Row 1: forward/backward */}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Tooltip title="Bring Forward">
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={bringForward}
                  color="primary"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Send Backward">
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={sendBackward}
                  color="primary"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Row 2: front/back */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Bring to Front">
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={bringToFront}
                  color="primary"
                >
                  <VerticalAlignTopIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Send to Back">
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={sendToBack}
                  color="primary"
                >
                  <VerticalAlignBottomIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        {/* Vertical divider */}
        <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />

        {/* RIGHT — Delete + Clear All stacked vertically */}
        <Stack spacing={1}>
          {/* Delete */}
          <Tooltip title="Delete Selected">
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                onClick={deleteSelected}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Clear All */}
          <Tooltip title="Clear All Items">
            <span>
              <IconButton
                size="small"
                disabled={objects.length === 0}
                onClick={clearAll}
                color="warning"
              >
                <ClearAllIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  )
}

export default SceneLayerControls
