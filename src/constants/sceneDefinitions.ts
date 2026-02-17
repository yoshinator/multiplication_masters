export type SceneTheme = 'garden' | 'spaceport' | 'farm' | 'garage'

export type SceneTab = 'background' | 'stuff' | 'friends' | 'effects'

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

  zHint?: 'back' | 'mid' | 'front'

  /**
   * Questions answered correctly to unlock this item.
   */
  unlock?: number
}

export type SceneDefinition = {
  id: SceneTheme
  label: string
  backgroundColor: string
  unlock?: number // questions answered correctly to unlock
}

export const SCENES: Record<SceneTheme, SceneDefinition> = {
  garden: {
    id: 'garden',
    label: 'Garden',
    backgroundColor: '#97d7f3ff',
    unlock: 0,
  },
  farm: { id: 'farm', label: 'Farm', backgroundColor: '#e9f3ff', unlock: 450 },
  garage: {
    id: 'garage',
    label: 'Garage',
    backgroundColor: '#e0e0e0',
    unlock: 800,
  },
  spaceport: {
    id: 'spaceport',
    label: 'Spaceport',
    backgroundColor: '#050814',
    unlock: 1500,
  },
}

export const SCENE_ITEMS: SceneItemDefinition[] = [
  // ---------- GARDEN THEME ----------
  ...range('garden', 'Background', 5, 'background', 1, {
    isBackground: true,
    zHint: 'back',
  }),
  ...range('garden', 'Friends', 14, 'friends'),
  ...range('garden', 'Stuff', 17, 'stuff'),
  ...range('garden', 'Effects', 12, 'effects'),
]

// -------------- SPACEPORT THEME --------------
SCENE_ITEMS.push(
  ...range('spaceport', 'Background', 4, 'background', 1, {
    isBackground: true,
    zHint: 'back',
  }),
  ...range('spaceport', 'Friends', 12, 'friends'),
  ...range('spaceport', 'Stuff', 12, 'stuff'),
  ...range('spaceport', 'Effects', 12, 'effects')
)

// -------------- FARM THEME --------------
SCENE_ITEMS.push(
  ...range('farm', 'Background', 3, 'background', 1, {
    isBackground: true,
    zHint: 'back',
  }),
  ...range('farm', 'Friends', 11, 'friends'),
  ...range('farm', 'Stuff', 13, 'stuff'),
  ...range('farm', 'Effects', 7, 'effects')
)

// -------------- GARAGE THEME --------------
SCENE_ITEMS.push(
  ...range('garage', 'Background', 4, 'background', 1, {
    isBackground: true,
    zHint: 'back',
  })
)

export const SCENE_ITEM_BY_ID: Record<string, SceneItemDefinition> =
  Object.fromEntries(SCENE_ITEMS.map((i) => [i.id, i]))

function makeLabel(fileOrId: string) {
  return fileOrId
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
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

function range(
  theme: SceneTheme,
  prefix: string,
  count: number,
  tab: SceneTab,
  scale = 0.2,
  extra?: Partial<SceneItemDefinition>
): SceneItemDefinition[] {
  const baseUnlock = 0

  // Define increments based on rarity request
  const increments: Record<SceneTab, number> = {
    background: 200, // Rare: Backgrounds take longer to unlock
    friends: 90, // Rare: Friends are special unlocks
    stuff: 25, // Free: Stuff is given out frequently
    effects: 40, // Free: Effects are given out frequently
  }

  const step = increments[tab]

  return Array.from({ length: count }, (_, i) =>
    item(theme, `${prefix}_${i + 1}.png`, tab, scale, {
      unlock: baseUnlock + i * step,
      ...extra,
    })
  )
}
