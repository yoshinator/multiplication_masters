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
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded'

import {
  useSceneBuilder,
  SceneBuilderContext,
} from '../SceneContext/sceneBuilderContext'
import { useModal } from '../../../contexts/modalContext/modalContext'
import AppModal from '../../AppModal/AppModal'
import ScenePalette from './ScenePalette'

const SceneLayerControls: FC = () => {
  const sceneContext = useSceneBuilder()
  const {
    selectedId,
    bringForward,
    bringToFront,
    sendBackward,
    sendToBack,
    deleteSelected,
    objects,
  } = sceneContext
  const { openModal, closeModal } = useModal()

  const disabled = !selectedId

  return (
    <Box>
      <Typography
        variant="subtitle1"
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
                  disabled={disabled}
                  onClick={bringForward}
                  color="primary"
                >
                  <ArrowUpwardIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Send Backward">
              <span>
                <IconButton
                  disabled={disabled}
                  onClick={sendBackward}
                  color="primary"
                >
                  <ArrowDownwardIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Row 2: front/back */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Bring to Front">
              <span>
                <IconButton
                  disabled={disabled}
                  onClick={bringToFront}
                  color="primary"
                >
                  <VerticalAlignTopIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Send to Back">
              <span>
                <IconButton
                  disabled={disabled}
                  onClick={sendToBack}
                  color="primary"
                >
                  <VerticalAlignBottomIcon />
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
                onClick={() =>
                  openModal(
                    <SceneBuilderContext.Provider value={sceneContext}>
                      <AppModal
                        onClose={closeModal}
                        open
                        title={`Add ${sceneContext.theme} Item`}
                      >
                        <ScenePalette onClickCallBack={closeModal} />
                      </AppModal>
                    </SceneBuilderContext.Provider>
                  )
                }
                color="success"
              >
                <LibraryAddRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* Delete */}
          <Tooltip title="Delete Selected Layer">
            <span>
              <IconButton
                disabled={objects.length === 0}
                onClick={deleteSelected}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  )
}

export default SceneLayerControls
