import { type FC } from 'react'
import { Box, Divider, Paper, Button, CircularProgress } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import SceneLayerControls from './SceneLayerControls'
import ScenePalette from './ScenePalette'
import SceneTransformControls from './SceneTransformControls'
import { useSceneBuilder } from '../SceneContext/sceneBuilderContext'

const SceneControls: FC = () => {
  const { saveToStorage, isSaving, sceneId } = useSceneBuilder()
  return (
    <Box
      sx={{
        width: { xs: '100%', md: 450 },
        p: 2,
        borderTop: { xs: 1, md: 0 },
        borderColor: 'divider',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <Box display={{ xs: 'none', md: 'block' }}>
        <ScenePalette />
      </Box>
      <Divider sx={{ my: 2 }} />

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <SceneTransformControls />

          <SceneLayerControls />
        </Box>
        <Button
          variant="contained"
          disabled={isSaving}
          color="primary"
          fullWidth
          startIcon={
            isSaving ? <CircularProgress size={20} /> : <CloudUploadIcon />
          }
          onClick={saveToStorage}
          sx={{ borderRadius: 0.5 }}
        >
          {sceneId ? 'Update' : 'Save'}
        </Button>
      </Paper>
    </Box>
  )
}

export default SceneControls
