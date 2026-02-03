import { useMemo, useState, type FC } from 'react'
import { Box, Button, Tab, Tabs, Tooltip, Typography } from '@mui/material'

import {
  SCENES,
  SCENE_ITEMS,
  type SceneItemDefinition,
  type SceneTab,
} from '../../../constants/sceneDefinitions'
import { useSceneBuilder } from '../SceneContext/sceneBuilderContext'

interface Props {
  onClickCallBack?: () => void
}

const TAB_ORDER: SceneTab[] = ['background', 'stuff', 'friends', 'effects']
const TAB_LABEL: Record<SceneTab, string> = {
  background: 'Scene',
  stuff: 'Stuff',
  friends: 'Friends',
  effects: 'Effects',
}

const ScenePalette: FC<Props> = ({ onClickCallBack }) => {
  const { theme, unlockedItemIds, addObject, setBackground } = useSceneBuilder()
  const sceneDef = SCENES[theme]

  const [activeTab, setActiveTab] = useState<SceneTab>('stuff')

  // Filter once
  const itemsByTab = useMemo(() => {
    const unlocked = new Set(unlockedItemIds)

    const base = SCENE_ITEMS.filter(
      (item) => item.theme === theme && unlocked.has(item.id)
    )

    return {
      background: base.filter((it) => it.tab === 'background'),
      stuff: base.filter((it) => it.tab === 'stuff'),
      friends: base.filter((it) => it.tab === 'friends'),
      effects: base.filter((it) => it.tab === 'effects'),
    } satisfies Record<SceneTab, SceneItemDefinition[]>
  }, [theme, unlockedItemIds])

  const currentItems = itemsByTab[activeTab]
  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        TAB_ORDER.map((t) => [t, itemsByTab[t].length])
      ) as Record<SceneTab, number>,
    [itemsByTab]
  )

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {sceneDef.label} Builder
      </Typography>

      {/* 4 fixed tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v: SceneTab) => setActiveTab(v)}
        variant="fullWidth"
        sx={{ mb: 1 }}
      >
        {TAB_ORDER.map((t) => (
          <Tab
            key={t}
            value={t}
            label={`${TAB_LABEL[t]}${tabCounts[t] ? ` (${tabCounts[t]})` : ''}`}
            sx={{ whiteSpace: 'nowrap', p: 0 }}
          />
        ))}
      </Tabs>

      {/* Grid */}
      {currentItems.length === 0 ? (
        <Box minHeight={440}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No unlocked items in this tab yet.
          </Typography>
        </Box>
      ) : (
        <Box
          display="flex"
          flexWrap="wrap"
          gap={1}
          minHeight={440}
          sx={{ mt: 1, alignContent: 'flex-start' }}
          justifyContent={'center'}
        >
          {currentItems.map((item) => (
            <Tooltip title={item.label} key={item.id}>
              <Button
                variant="outlined"
                sx={{
                  width: { xs: 70, sm: 80 },
                  height: { xs: 70, sm: 80 },
                  maxWidth: { xs: 70, sm: 80 },
                  minWidth: { xs: 70, sm: 80 },
                  p: 1,
                  mx: { xs: 0, sm: 1 },
                  borderColor: 'divider',
                }}
                onClick={() => {
                  if (item.tab === 'background') {
                    // Background items should not become draggable objects
                    setBackground(item)
                  } else {
                    addObject(item)
                  }
                  onClickCallBack?.()
                }}
                aria-label={item.label}
              >
                <Box
                  component="img"
                  src={item.image}
                  alt={item.label}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Button>
            </Tooltip>
          ))}
        </Box>
      )}
    </>
  )
}

export default ScenePalette
