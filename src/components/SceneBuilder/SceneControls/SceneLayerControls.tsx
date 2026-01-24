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

import { LibraryAddRounded } from '@mui/icons-material'

import { useSceneBuilder } from '../SceneContext/sceneBuilderContext'
import { useModal } from '../../../contexts/modalContext/modalContext'
import AppModal from '../../AppModal/AppModal'
import ScenePalette from './ScenePalette'

const SceneLayerControls: FC = () => {
  const {
    theme,
    unlockedItemIds,
    addObject,
    selectedId,
    bringForward,
    bringToFront,
    sendBackward,
    sendToBack,
    deleteSelected,
    objects,
  } = useSceneBuilder()
  const { openModal, closeModal } = useModal()

  const disabled = !selectedId

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, mb: 1, opacity: 0.8 }}
      >
        Front/Back
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

        {/* RIGHT — Add + Delete Single Layer */}
        <Stack spacing={1}>
          {/* Add */}
          <Tooltip title="Open Add Layer">
            <span>
              <IconButton
                size="small"
                onClick={() =>
                  openModal(
                    <AppModal onClose={closeModal} open title="Add Layer">
                      <ScenePalette
                        theme={theme}
                        unlockedItemIds={unlockedItemIds}
                        addObject={addObject}
                        onClickCallBack={closeModal}
                      />
                    </AppModal>
                  )
                }
                color="success"
              >
                <LibraryAddRounded />
              </IconButton>
            </span>
          </Tooltip>

          {/* Delete */}
          <Tooltip title="Delete Selected Layer">
            <span>
              <IconButton
                size="small"
                disabled={objects.length === 0}
                onClick={deleteSelected}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  )
}

export default SceneLayerControls
