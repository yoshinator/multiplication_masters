// src/pages/SceneBuilderPage.tsx

import { type FC, useMemo } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { type SceneObjectInstance } from '../../components/SceneBuilder/sceneBuilderTypes'
import SceneBuilder from '../../components/SceneBuilder/SceneBuilder'
import { type SceneTheme } from '../../constants/sceneDefinitions'
import { useSearchParams } from 'react-router-dom'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { doc } from 'firebase/firestore'
import { type SavedScene } from '../../constants/dataModels'
import { useFirestoreDoc } from '../../hooks/useFirestore'

// TODO: get these from Firestore + gamification:
const mockUnlocked = [
  'garden_Background1',
  'garden_FlowerPatch',
  'garden_FlowerPatch1',
  'garden_FlowerPatch2',
  'garden_FlowerPatch3',
  'garden_MushroomPatch',
  'garden_ColoredCloud',
  'garden_ColoredCloud1',
  'garden_SkyView1',
  'garden_Sunbeam',
  'garden_Sunbeam1',
  'garden_Sunbeam2',
  'garden_Sunbeam3',
  'garden_Sunbeam4',
  'garden_Sunbeam5',
  'garden_Sunbeam6',
  'garden_Rainbow1',
  'garden_Rainbow2',
  'garden_BlueBird',
  'garden_RedBird',
  'garden_GoldenBird',
]

const SceneBuilderPage: FC = () => {
  const [searchParams] = useSearchParams()
  const sceneId = searchParams.get('id')
  const { db, auth } = useFirebaseContext()

  const docRef = useMemo(() => {
    if (!sceneId || !db || !auth?.currentUser) return null
    return doc(db, 'users', auth.currentUser.uid, 'savedScenes', sceneId)
  }, [sceneId, db, auth?.currentUser])

  const { data: savedScene, loading } = useFirestoreDoc<SavedScene>(docRef)

  const handleLayoutChange = (objects: SceneObjectInstance[]) => {
    console.log('layout changed', objects)
  }

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

  // Prepare initial props from loaded data or defaults
  const initialObjects = savedScene?.objects || []
  const activeTheme = (savedScene?.theme as SceneTheme) || 'garden'
  const initialBackgroundId = savedScene?.backgroundId || undefined
  const initialThumbnailUrl = savedScene?.thumbnailUrl
  const initialName = savedScene?.name

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <SceneBuilder
        sceneId={sceneId || undefined}
        theme={activeTheme}
        unlockedItemIds={mockUnlocked}
        initialObjects={initialObjects}
        initialBackgroundId={initialBackgroundId}
        initialThumbnailUrl={initialThumbnailUrl}
        initialName={initialName}
        onLayoutChange={handleLayoutChange}
      />
    </Box>
  )
}

export default SceneBuilderPage
