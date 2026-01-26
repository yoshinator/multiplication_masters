import { type FC, useEffect, useState } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { type SavedScene } from '../../constants/dataModels'

const SavedScenesGallery: FC = () => {
  const { user, updateUser } = useUser()
  const { app, storage } = useFirebaseContext()
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([])

  useEffect(() => {
    if (!user?.uid || !app) return
    const db = getFirestore(app)
    const q = query(
      collection(db, 'users', user.uid, 'savedScenes'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, (snapshot) => {
      setSavedScenes(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as SavedScene[]
      )
    })
  }, [user?.uid, app])

  const handleDeleteScene = async (e: React.MouseEvent, scene: SavedScene) => {
    e.stopPropagation()
    if (!app || !user?.uid || !storage) return

    try {
      const imageRef = ref(storage, scene.thumbnailUrl)
      await deleteObject(imageRef)
    } catch (err) {
      console.error('Failed to delete scene image', err)
    }

    try {
      const db = getFirestore(app)
      await deleteDoc(doc(db, 'users', user.uid, 'savedScenes', scene.id))

      if (user.activeSavedSceneId === scene.id) {
        updateUser({ activeSavedSceneId: null })
      }
    } catch (err) {
      console.error('Failed to delete scene doc', err)
    }
  }

  if (savedScenes.length === 0) return null

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Saved Scenes
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {savedScenes.map((scene) => {
          const selected = user?.activeSavedSceneId === scene.id
          return (
            <Box
              key={scene.id}
              component="button"
              type="button"
              onClick={() => updateUser({ activeSavedSceneId: scene.id })}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                position: 'relative',
                width: 112,
                height: 147,
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
              <IconButton
                size="small"
                onClick={(e) => handleDeleteScene(e, scene)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  '&:hover': { bgcolor: 'white' },
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default SavedScenesGallery
