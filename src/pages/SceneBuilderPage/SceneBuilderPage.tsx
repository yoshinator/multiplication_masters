// src/pages/SceneBuilderPage.tsx

import type { FC } from 'react'
import { Box } from '@mui/material'
import {
  SceneBuilder,
  type SceneObjectInstance,
} from '../../components/SceneBuilder/SceneBuilder'
import { type SceneTheme } from '../../constants/sceneDefinitions'

// TODO: get these from Firestore + gamification:
const mockUnlocked = [
  'FlowerPatch',
  'FlowerPatch1',
  'FlowerPatch2',
  'FlowerPatch3',
  'MushroomPatch',
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
