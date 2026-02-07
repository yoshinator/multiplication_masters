// src/pages/SceneBuilderPage.tsx

import { type FC, useMemo } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import SceneBuilder from '../../components/SceneBuilder/SceneBuilder'
import { useSearchParams } from 'react-router-dom'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { doc } from 'firebase/firestore'
import { type SavedScene } from '../../constants/dataModels'
import { useFirestoreDoc } from '../../hooks/useFirestore'

const SceneBuilderPage: FC = () => {
  const [searchParams] = useSearchParams()
  const sceneId = searchParams.get('id')
  const { db, auth } = useFirebaseContext()

  const docRef = useMemo(() => {
    if (!sceneId || !db || !auth?.currentUser) return null
    return doc(db, 'users', auth.currentUser.uid, 'savedScenes', sceneId)
  }, [sceneId, db, auth?.currentUser])

  const { data: savedScene, loading } = useFirestoreDoc<SavedScene>(docRef)

  // If we have a sceneId but are loading, show spinner
  if (sceneId && loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    )
  }

  // If we have a sceneId but no data was found after loading completes
  if (sceneId && !loading && !savedScene) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <Typography variant="h5">Scene not found</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <SceneBuilder sceneId={sceneId || undefined} savedScene={savedScene} />
    </Box>
  )
}

export default SceneBuilderPage
