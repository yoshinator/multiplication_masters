import { type FC, type ReactNode, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { SceneBuilderContext } from './sceneBuilderContext'
import { useFirebaseContext } from '../../../contexts/firebase/firebaseContext'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'

import type {
  SceneItemDefinition,
  SceneTheme,
} from '../../../constants/sceneDefinitions'

import { normalizeZ, swapZ, bringToFront, sendToBack } from '../sceneUtils'
import type Konva from 'konva'
import type { SceneObjectInstance } from '../sceneBuilderTypes'
import { useNotification } from '../../../contexts/notificationContext/notificationContext'

type Props = {
  theme: SceneTheme
  unlockedItemIds: string[]
  initialObjects?: SceneObjectInstance[]
  onLayoutChange?: (objects: SceneObjectInstance[]) => void
  children: ReactNode
}

export const SceneBuilderProvider: FC<Props> = ({
  theme,
  unlockedItemIds,
  initialObjects = [],
  onLayoutChange,
  children,
}) => {
  const { storage, auth, app } = useFirebaseContext()
  const stageRef = useRef<Konva.Stage>(null)
  const [objects, setObjects] = useState<SceneObjectInstance[]>(
    normalizeZ(initialObjects)
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { showNotification } = useNotification()

  const updateObjects = (next: SceneObjectInstance[]) => {
    const normalized = normalizeZ(next)
    setObjects(normalized)
    onLayoutChange?.(normalized)
  }

  // Add object
  const addObject = (def: SceneItemDefinition) => {
    const instance: SceneObjectInstance = {
      id: uuidv4(),
      itemId: def.id,
      x: 200,
      y: 200,
      scale: def.defaultScale ?? 1,
      rotation: 0,
      z: objects.length,
    }
    updateObjects([...objects, instance])
    setSelectedId(instance.id)
  }

  const updateObject = (updated: SceneObjectInstance) => {
    updateObjects(objects.map((o) => (o.id === updated.id ? updated : o)))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    updateObjects(objects.filter((o) => o.id !== selectedId))
    setSelectedId(null)
  }

  const clearAll = () => {
    updateObjects([])
    setSelectedId(null)
  }

  const bringForward = () => {
    if (!selectedId) return
    updateObjects(swapZ(objects, selectedId, +1))
  }

  const sendBackward = () => {
    if (!selectedId) return
    updateObjects(swapZ(objects, selectedId, -1))
  }

  const bringToFrontFn = () => {
    if (!selectedId) return
    updateObjects(bringToFront(objects, selectedId))
  }

  const sendToBackFn = () => {
    if (!selectedId) return
    updateObjects(sendToBack(objects, selectedId))
  }

  const exportImage = () => {
    const uri = stageRef.current?.toDataURL()
    const win = window.open()
    if (win) {
      win.document.write(
        `<iframe src="${uri}" frameborder="0" style="width:100%;height:100%;"></iframe>`
      )
    }
  }

  const saveToStorage = async () => {
    const stage = stageRef.current
    if (!stage || !storage || !auth?.currentUser || !app) return

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        stage.toBlob({
          callback: resolve,
          mimeType: 'image/png',
        })
      })

      if (!blob) throw new Error('Failed to generate image blob')

      const filename = `${uuidv4()}.png`
      const storageRef = ref(
        storage,
        `users/${auth.currentUser.uid}/scenes/${filename}`
      )

      const snapshot = await uploadBytes(storageRef, blob)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Call Cloud Function to save scene data
      const functions = getFunctions(app)
      const saveSceneFn = httpsCallable(functions, 'saveUserScene')

      await saveSceneFn({
        objects,
        theme,
        thumbnailUrl: downloadURL,
        name: `Scene ${new Date().toLocaleDateString()}`,
      })
    } catch {
      showNotification('Error saving scene to storage:', 'error')
    }
  }

  const value = {
    theme,
    stageRef,
    objects,
    selectedId,
    unlockedItemIds,
    addObject,
    updateObject,
    deleteSelected,
    clearAll,
    setSelectedId,
    bringForward,
    sendBackward,
    bringToFront: bringToFrontFn,
    sendToBack: sendToBackFn,
    exportImage,
    saveToStorage,
  }

  return (
    <SceneBuilderContext.Provider value={value}>
      {children}
    </SceneBuilderContext.Provider>
  )
}
