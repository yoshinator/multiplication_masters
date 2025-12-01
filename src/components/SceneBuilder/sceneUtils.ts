import { type SceneObjectInstance } from './sceneBuilderTypes'

export const normalizeZ = (items: SceneObjectInstance[]) => {
  return [...items].sort((a, b) => a.z - b.z).map((o, i) => ({ ...o, z: i }))
}

export const swapZ = (
  items: SceneObjectInstance[],
  id: string,
  dir: 1 | -1
) => {
  const sorted = normalizeZ(items)
  const index = sorted.findIndex((o) => o.id === id)
  if (index === -1) return sorted

  const targetIndex = index + dir
  if (targetIndex < 0 || targetIndex >= sorted.length) return sorted

  const temp = sorted[index]
  sorted[index] = sorted[targetIndex]
  sorted[targetIndex] = temp

  return normalizeZ(sorted)
}

export const bringToFront = (items: SceneObjectInstance[], id: string) => {
  const sorted = normalizeZ(items)
  const max = sorted.length - 1

  return sorted.map((o) => (o.id === id ? { ...o, z: max + 1 } : o))
}

export const sendToBack = (items: SceneObjectInstance[], id: string) => {
  const sorted = normalizeZ(items)

  return sorted.map((o) => (o.id === id ? { ...o, z: -1 } : o))
}
