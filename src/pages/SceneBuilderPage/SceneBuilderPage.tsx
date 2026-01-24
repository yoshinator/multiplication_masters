// src/pages/SceneBuilderPage.tsx

import type { FC } from 'react'
import { Box } from '@mui/material'
import { type SceneObjectInstance } from '../../components/SceneBuilder/sceneBuilderTypes'
import SceneBuilder from '../../components/SceneBuilder/SceneBuilder'
import { type SceneTheme } from '../../constants/sceneDefinitions'

// TODO: get these from Firestore + gamification:
const mockUnlocked = [
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
]
// TODO: load saved layout from Firestore/IndexedDB
const mockInitial: SceneObjectInstance[] = []

const activeTheme: SceneTheme = 'garden'

const SceneBuilderPage: FC = () => {
  const handleLayoutChange = (objects: SceneObjectInstance[]) => {
    // This is where we will persist to Firestore:
    // await setDoc(doc(db, `users/${userId}/sceneLayout`), { objects }, { merge: true })
    console.log('layout changed', objects)
  }

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <SceneBuilder
        theme={activeTheme}
        unlockedItemIds={mockUnlocked}
        initialObjects={mockInitial}
        onLayoutChange={handleLayoutChange}
      />
    </Box>
  )
}

export default SceneBuilderPage
