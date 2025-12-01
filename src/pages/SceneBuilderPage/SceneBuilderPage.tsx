// src/pages/SceneBuilderPage.tsx

import type { FC } from 'react'
import { Box } from '@mui/material'
import { type SceneObjectInstance } from '../../components/SceneBuilder/sceneBuilderTypes'
import SceneBuilder from '../../components/SceneBuilder/SceneBuilder'
import { type SceneTheme } from '../../constants/sceneDefinitions'

// TODO: get these from Firestore + gamification:
const mockUnlocked = [
  'FlowerPatch',
  'FlowerPatch1',
  'FlowerPatch2',
  'FlowerPatch3',
  'MushroomPatch',
  'ColoredCloud',
  'ColoredCloud1',
  'SkyView1',
  'Sunbeam',
  'Sunbeam1',
  'Sunbeam2',
  'Sunbeam3',
  'Sunbeam4',
  'Sunbeam5',
  'Sunbeam6',
  'Rainbow1',
  'Rainbow2',
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
