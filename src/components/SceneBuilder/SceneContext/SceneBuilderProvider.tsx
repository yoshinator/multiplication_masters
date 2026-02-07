import { type FC, type ReactNode, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { SceneBuilderContext } from './sceneBuilderContext'
import { useFirebaseContext } from '../../../contexts/firebase/firebaseContext'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'

import {
  SCENE_ITEM_BY_ID,
  type SceneItemDefinition,
  type SceneTheme,
} from '../../../constants/sceneDefinitions'

import { normalizeZ, swapZ, bringToFront, sendToBack } from '../sceneUtils'
import type Konva from 'konva'
import { type SceneObjectInstance } from '../sceneBuilderTypes'
import { useNotification } from '../../../contexts/notificationContext/notificationContext'
import { extractErrorMessage } from '../../../utilities/typeutils'
import { useCloudFunction } from '../../../hooks/useCloudFunction'
import { type SavedScene } from '../../../constants/dataModels'
import { useUser } from '../../../contexts/userContext/useUserContext'

type Props = {
  sceneId?: string
  savedScene?: SavedScene | null
  onLayoutChange?: (objects: SceneObjectInstance[]) => void
  children: ReactNode
}

export const SceneBuilderProvider: FC<Props> = ({
  sceneId,
  onLayoutChange,
  children,
  savedScene,
}) => {
  const initialObjects = savedScene?.objects || []
  const initialBackgroundId = savedScene?.backgroundId
  const initialThumbnailUrl = savedScene?.thumbnailUrl
  const initialName = savedScene?.name

  const { storage, auth, app } = useFirebaseContext()
  const { user } = useUser()
  const theme =
    savedScene?.theme || user?.activeScene || ('garden' as SceneTheme)
  const [currentThumbnailUrl, setCurrentThumbnailUrl] =
    useState(initialThumbnailUrl)

  const stageRef = useRef<Konva.Stage>(null)
  const [objects, setObjects] = useState<SceneObjectInstance[]>(() => {
    const normalized = normalizeZ(initialObjects)
    // Check if background is already in objects (from saved scene)
    const hasBackground = normalized.some(
      (o) => SCENE_ITEM_BY_ID[o.itemId]?.isBackground
    )

    if (!hasBackground && initialBackgroundId) {
      const bgInstance: SceneObjectInstance = {
        id: uuidv4(),
        itemId: initialBackgroundId,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        z: -1,
      }
      return [bgInstance, ...normalized]
    }
    return normalized
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { showNotification } = useNotification()
  const { execute: saveUserScene, isPending: isSaving } =
    useCloudFunction('saveUserScene')

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

  const setBackground = (def: SceneItemDefinition) => {
    const others = objects.filter(
      (o) => !SCENE_ITEM_BY_ID[o.itemId]?.isBackground
    )
    const newBg: SceneObjectInstance = {
      id: uuidv4(),
      itemId: def.id,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      z: -1,
    }
    updateObjects([newBg, ...others])
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
    const bg = objects.find((o) => SCENE_ITEM_BY_ID[o.itemId]?.isBackground)
    updateObjects(bg ? [bg] : [])
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

    const previousUrl = currentThumbnailUrl
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
      await saveUserScene({
        id: sceneId, // Pass the ID to update existing scene
        sceneId,
        objects,
        backgroundId,
        theme,
        thumbnailUrl: downloadURL,
        name: initialName || `Scene ${new Date().toLocaleDateString()}`,
      })

      setCurrentThumbnailUrl(downloadURL)

      if (sceneId && previousUrl && previousUrl !== downloadURL) {
        try {
          await deleteObject(ref(storage, previousUrl))
        } catch (error) {
          showNotification(
            'Error deleting old thumbnail: ' + extractErrorMessage(error),
            'error'
          )
        }
      }

      showNotification(
        sceneId ? 'Scene updated successfully' : 'Scene saved successfully',
        'success'
      )
    } catch (error) {
      showNotification(
        `Error saving scene to storage: ${extractErrorMessage(error)}`,
        'error'
      )
    }
  }

  // Derived state for consumers
  const backgroundObject = objects.find(
    (o) => SCENE_ITEM_BY_ID[o.itemId]?.isBackground
  )
  const backgroundId = backgroundObject?.itemId || null
  const visibleObjects = objects.filter((o) => o !== backgroundObject)

  const value = {
    sceneId: sceneId || null,
    theme,
    stageRef,
    objects: visibleObjects,
    selectedId,
    backgroundId,
    addObject,
    setBackground,
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
    isSaving,
  }

  return (
    <SceneBuilderContext.Provider value={value}>
      {children}
    </SceneBuilderContext.Provider>
  )
}
