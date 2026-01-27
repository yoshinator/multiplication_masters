import { createContext, useContext, type RefObject } from 'react'
import type { SceneObjectInstance } from '../sceneBuilderTypes'
import type {
  SceneItemDefinition,
  SceneTheme,
} from '../../../constants/sceneDefinitions'
import type Konva from 'konva'

export type SceneBuilderContextValue = {
  theme: SceneTheme
  stageRef: RefObject<Konva.Stage | null>

  objects: SceneObjectInstance[]
  selectedId: string | null

  unlockedItemIds: string[]
  addObject: (def: SceneItemDefinition) => void
  updateObject: (obj: SceneObjectInstance) => void
  deleteSelected: () => void
  clearAll: () => void
  setSelectedId: (id: string | null) => void

  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void

  exportImage: () => void
  saveToStorage: () => Promise<void>
  isSaving: boolean
}

export const SceneBuilderContext =
  createContext<SceneBuilderContextValue | null>(null)

export const useSceneBuilder = () => {
  const ctx = useContext(SceneBuilderContext)
  if (!ctx)
    throw new Error(
      'useSceneBuilder must be used within <SceneBuilderProvider>'
    )
  return ctx
}
