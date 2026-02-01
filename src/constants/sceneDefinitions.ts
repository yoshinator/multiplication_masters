export type SceneTheme = 'garden' | 'spaceport' | 'farm' | 'garage'

export type SceneTab = 'background' | 'stuff' | 'characters' | 'effects'

export type SceneItemDefinition = {
  id: string
  label: string
  image: string
  defaultScale?: number
  theme: SceneTheme
  tab: SceneTab

  /**
   * If true, this item is meant to set the scene background (not draggable)
   * You can also treat all tab==='background' as non-draggable.
   */
  isBackground?: boolean

  // Optional future hooks
  tags?: string[]
  zHint?: 'back' | 'mid' | 'front'
}

export type SceneDefinition = {
  id: SceneTheme
  label: string
  backgroundColor: string
}

export const SCENES: Record<SceneTheme, SceneDefinition> = {
  garden: { id: 'garden', label: 'Garden', backgroundColor: '#97d7f3ff' },
  spaceport: {
    id: 'spaceport',
    label: 'Spaceport',
    backgroundColor: '#050814',
  },
  farm: { id: 'farm', label: 'Farm', backgroundColor: '#e9f3ff' },
  garage: { id: 'garage', label: 'Garage', backgroundColor: '#e0e0e0' },
}

export const SCENE_ITEMS: SceneItemDefinition[] = [
  // ---------- BACKGROUND (optional for now) ----------
  // If you don't have background images yet, you can skip these entirely.
  // Or create a few simple "background" swatches (still images) later.
  // item('garden', 'GardenBg1.png', 'background', 1, { isBackground: true }),

  // ---------- BACKGROUNDS ----------
  // item('garden', 'Background1.jpg', 'background', 1, {
  //   isBackground: true,
  //   zHint: 'back',
  // }),

  // ---------- CHARACTERS ----------
  item('garden', 'BlueBird.png', 'characters'),
  item('garden', 'RedBird.png', 'characters'),
  item('garden', 'GoldenBird.png', 'characters'),

  // ---------- STUFF ----------
  // Flowers & Plants
  item('garden', 'FlowerPatch.png', 'stuff'),
  item('garden', 'FlowerPatch1.png', 'stuff'),
  item('garden', 'FlowerPatch2.png', 'stuff'),
  item('garden', 'FlowerPatch3.png', 'stuff'),
  item('garden', 'FlowerPatch4.png', 'stuff'),
  item('garden', 'FlowerPatch5.png', 'stuff'),
  item('garden', 'MushroomPatch.png', 'stuff'),
  item('garden', 'MushroomPatch2.png', 'stuff'),
  item('garden', 'WateringCanPot1.png', 'stuff'),
  item('garden', 'WateringCanPot2.png', 'stuff'),

  // Trees
  item('garden', 'ColorTree.png', 'stuff'),
  item('garden', 'TreeSwing.png', 'stuff'),

  // Water Features
  item('garden', 'BirdBath.png', 'stuff'),
  item('garden', 'BirdBath2.png', 'stuff'),
  item('garden', 'BlueJaysBath.png', 'stuff'),
  item('garden', 'DuckPond.png', 'stuff'),

  // Decor
  item('garden', 'BirdHouse.png', 'stuff'),
  item('garden', 'BirdHouse2.png', 'stuff'),
  item('garden', 'TeaPot.png', 'stuff'),
  item('garden', 'RockBed.png', 'stuff'),

  // Paths & Walkways
  item('garden', 'RockPath.png', 'stuff'),
  item('garden', 'WalkPath.png', 'stuff'),
  item('garden', 'WalkWay.png', 'stuff'),
  item('garden', 'WalkWay1.png', 'stuff'),
  item('garden', 'WalkWay2.png', 'stuff'),
  item('garden', 'WalkWay3.png', 'stuff'),
  item('garden', 'WalkWay4.png', 'stuff'),
  item('garden', 'WalkWay5.png', 'stuff'),
  item('garden', 'WalkWay6.png', 'stuff'),
  item('garden', 'WalkWay7.png', 'stuff'),
  item('garden', 'WalkWay8.png', 'stuff'),
  item('garden', 'WalkWay9.png', 'stuff'),
  item('garden', 'WalkWay10.png', 'stuff'),
  item('garden', 'WalkWay11.png', 'stuff'),

  // ---------- EFFECTS ----------
  // Colored Clouds
  item('garden', 'ColoredCloud.png', 'effects'),
  item('garden', 'ColoredCloud1.png', 'effects'),
  item('garden', 'ColoredCloud2.png', 'effects'),
  item('garden', 'ColoredCloud3.png', 'effects'),
  item('garden', 'ColoredCloud4.png', 'effects'),
  item('garden', 'ColoredCloud5.png', 'effects'),
  item('garden', 'ColoredCloud6.png', 'effects'),

  // Sky Views
  item('garden', 'SkyView1.png', 'effects'),
  item('garden', 'SkyView2.png', 'effects'),
  item('garden', 'SkyView3.png', 'effects'),

  // Sun Beams
  item('garden', 'Sunbeam.png', 'effects'),
  item('garden', 'Sunbeam1.png', 'effects'),
  item('garden', 'Sunbeam2.png', 'effects'),
  item('garden', 'Sunbeam3.png', 'effects'),
  item('garden', 'Sunbeam4.png', 'effects'),
  item('garden', 'Sunbeam5.png', 'effects'),
  item('garden', 'Sunbeam6.png', 'effects'),

  // Rainbows
  item('garden', 'Rainbow1.png', 'effects'),
  item('garden', 'Rainbow2.png', 'effects'),
]

export const SCENE_ITEM_BY_ID: Record<string, SceneItemDefinition> =
  Object.fromEntries(SCENE_ITEMS.map((i) => [i.id, i]))

function makeLabel(fileOrId: string) {
  return fileOrId
    .replace(/\.[^/.]+$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

function item(
  theme: SceneTheme,
  file: string,
  tab: SceneTab,
  scale = 0.2,
  extra?: Partial<SceneItemDefinition>
): SceneItemDefinition {
  const baseId = file.replace(/\.[^/.]+$/, '')
  return {
    id: `${theme}_${baseId}`,
    label: makeLabel(baseId),
    image: `/assets/scenes/${theme}/${file}`,
    defaultScale: scale,
    theme,
    tab,
    ...extra,
  }
}
