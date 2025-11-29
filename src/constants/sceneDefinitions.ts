// src/constants/sceneDefinitions.ts

export type SceneTheme = 'garden' | 'spaceport' | 'farm' | 'garage'

export type SceneItemDefinition = {
  id: string
  label: string
  image: string
  defaultScale?: number
}

export type SceneItemCategory = {
  id: string
  label: string
  items: SceneItemDefinition[]
}

export type SceneDefinition = {
  id: SceneTheme
  label: string
  backgroundColor: string
  categories: SceneItemCategory[]
}

function makeLabel(file: string) {
  return file
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/([A-Z])/g, ' $1') // turn CamelCase into words
    .trim()
}

function item(file: string, scale = 0.2): SceneItemDefinition {
  const id = file.replace(/\.[^/.]+$/, '')
  return {
    id,
    label: makeLabel(id),
    image: `/assets/scenes/garden/${file}`,
    defaultScale: scale,
  }
}

export const SCENES: Record<SceneTheme, SceneDefinition> = {
  garden: {
    id: 'garden',
    label: 'Garden',
    backgroundColor: '#c6f1c1',

    categories: [
      // BIRDS
      {
        id: 'birds',
        label: 'Birds',
        items: [
          item('BlueBird.png', 0.9),
          item('RedBird.png', 0.9),
          item('GoldenBird.png', 0.9),
        ],
      },

      // FLOWERS & PLANTS
      {
        id: 'flowers_plants',
        label: 'Flowers & Plants',
        items: [
          item('FlowerPatch.png'),
          item('FlowerPatch1.png'),
          item('FlowerPatch2.png'),
          item('FlowerPatch3.png'),
          item('FlowerPatch4.png'),
          item('FlowerPatch5.png'),
          item('MushroomPatch.png'),
          item('MushroomPatch2.png'),
          item('WateringCanPot1.png'),
          item('WateringCanPot2.png'),
        ],
      },

      // TREES
      {
        id: 'trees',
        label: 'Trees',
        items: [item('ColorTree.png'), item('TreeSwing.png')],
      },

      // 💧 WATER FEATURES
      {
        id: 'water_features',
        label: 'Water Features',
        items: [
          item('BirdBath.png'),
          item('BirdBath2.png'),
          item('BlueJaysBath.png'),
          item('DuckPond.png'),
        ],
      },

      // DECOR
      {
        id: 'decor',
        label: 'Garden Decor',
        items: [
          item('BirdHouse.png'),
          item('BirdHouse2.png'),
          item('TeaPot.png'),
          item('RockBed.png'),
        ],
      },

      // PATHS & WALKWAYS
      {
        id: 'paths',
        label: 'Paths & Walkways',
        items: [
          item('RockPath.png'),
          item('WalkPath.png'),
          item('WalkWay.png'),
          item('WalkWay1.png'),
          item('WalkWay2.png'),
          item('WalkWay3.png'),
          item('WalkWay4.png'),
          item('WalkWay5.png'),
          item('WalkWay6.png'),
          item('WalkWay7.png'),
          item('WalkWay8.png'),
          item('WalkWay9.png'),
          item('WalkWay10.png'),
          item('WalkWay11.png'),
        ],
      },
    ],
  },

  // ⭐ LEAVE THESE AS THEY WERE (NOT PROCURED YET)
  spaceport: {
    id: 'spaceport',
    label: 'Spaceport',
    backgroundColor: '#050814',
    categories: [],
  },

  farm: {
    id: 'farm',
    label: 'Farm',
    backgroundColor: '#e9f3ff',
    categories: [],
  },

  garage: {
    id: 'garage',
    label: 'Garage',
    backgroundColor: '#e0e0e0',
    categories: [],
  },
}
