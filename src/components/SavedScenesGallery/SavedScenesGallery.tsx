import { type FC, type KeyboardEvent, type MouseEvent, useMemo } from 'react'
import { Box, Typography, IconButton, Stack } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { type SavedScene } from '../../constants/dataModels'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { useFirestoreQuery } from '../../hooks/useFirestore'
import { useNavigate } from 'react-router-dom'

const SavedScenesGallery: FC = () => {
  const { user, updateUser, activeProfileId } = useUser()
  const { db, storage } = useFirebaseContext()
  const { showNotification } = useNotification()
  const navigate = useNavigate()

  const scenesQuery = useMemo(() => {
    if (!user?.uid || !db || !activeProfileId) return null
    return query(
      collection(
        db,
        'users',
        user.uid,
        'profiles',
        activeProfileId,
        'savedScenes'
      ),
      orderBy('createdAt', 'desc')
    )
  }, [user?.uid, db, activeProfileId])

  const { data: savedScenes } = useFirestoreQuery<SavedScene>(scenesQuery)

  const handleDeleteScene = async (e: MouseEvent, scene: SavedScene) => {
    e.stopPropagation()
    if (!db || !user?.uid || !storage || !activeProfileId) return

    try {
      const imageRef = ref(storage, scene.thumbnailUrl)
      await deleteObject(imageRef)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code !== 'storage/object-not-found'
      ) {
        showNotification('Failed to delete scene image', 'error')
        return
      }
    }

    try {
      await deleteDoc(
        doc(
          db,
          'users',
          user.uid,
          'profiles',
          activeProfileId,
          'savedScenes',
          scene.id
        )
      )

      if (user.activeSavedSceneId === scene.id) {
        updateUser({ activeSavedSceneId: null })
      }
    } catch {
      showNotification('Failed to delete scene doc', 'error')
    }
  }

  const handleEditScene = (e: MouseEvent, scene: SavedScene) => {
    e.stopPropagation()
    navigate(`/builder?id=${scene.id}`)
  }

  const handleChoiceKeyDown = (e: KeyboardEvent, sceneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      updateUser({ activeSavedSceneId: sceneId })
    }
  }

  if (savedScenes.length === 0) return null

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Saved Scenes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Pick a custom scene or edit one in the builder.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.25,
        }}
      >
        {savedScenes.map((scene) => {
          const selected = user?.activeSavedSceneId === scene.id
          return (
            <Box
              key={scene.id}
              component="div"
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => updateUser({ activeSavedSceneId: scene.id })}
              onKeyDown={(e) => handleChoiceKeyDown(e, scene.id)}
              sx={{
                cursor: 'pointer',
                position: 'relative',
                width: '100%',
                aspectRatio: '4 / 3',
                borderRadius: 1,
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: selected ? 4 : 1,
                '&:hover': {
                  borderColor: selected ? 'primary.main' : 'text.primary',
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                component="img"
                src={scene.thumbnailUrl}
                alt={scene.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 1,
                }}
              />
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                }}
              >
                <IconButton
                  aria-label="Edit Scene"
                  size="small"
                  onClick={(e) => handleEditScene(e, scene)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&:hover': { bgcolor: 'white' },
                  }}
                >
                  <EditIcon fontSize="small" color="primary" />
                </IconButton>
                <IconButton
                  aria-label="Delete Scene"
                  size="small"
                  onClick={(e) => handleDeleteScene(e, scene)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&:hover': { bgcolor: 'white' },
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Stack>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default SavedScenesGallery
