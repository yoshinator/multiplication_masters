import { useMemo, useState, type FC } from 'react'
import { Box, Button, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { doc } from 'firebase/firestore'

import {
  SCENES,
  SCENE_ITEMS,
  type SceneItemDefinition,
  type SceneTab,
} from '../../../constants/sceneDefinitions'
import { useSceneBuilder } from '../SceneContext/sceneBuilderContext'
import { useUser } from '../../../contexts/userContext/useUserContext'
import { useFirebaseContext } from '../../../contexts/firebase/firebaseContext'
import { useFirestoreDoc } from '../../../hooks/useFirestore'
import { type UserSceneMeta } from '../../../constants/dataModels'

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
  const { theme, addObject, setBackground } = useSceneBuilder()
  const { user } = useUser()
  const { db } = useFirebaseContext()
  const sceneDef = SCENES[theme]

  const [activeTab, setActiveTab] = useState<SceneTab>('stuff')

  const sceneMetaRef = useMemo(() => {
    if (!user?.uid || !db) return null
    return doc(db, 'users', user.uid, 'sceneMeta', theme)
  }, [user?.uid, db, theme])

  const { data: sceneMeta } = useFirestoreDoc<UserSceneMeta>(sceneMetaRef)
  const currentXP = sceneMeta?.xp ?? 0

  // Filter once
  const itemsByTab = useMemo(() => {
    const base = SCENE_ITEMS.filter((item) => item.theme === theme)

    return {
      background: base.filter((it) => it.tab === 'background'),
      stuff: base.filter((it) => it.tab === 'stuff'),
      friends: base.filter((it) => it.tab === 'friends'),
      effects: base.filter((it) => it.tab === 'effects'),
    } satisfies Record<SceneTab, SceneItemDefinition[]>
  }, [theme])

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
          {currentItems.map((item) => {
            const isLocked = (item.unlock ?? 0) > currentXP

            return (
              <Tooltip
                title={isLocked ? `Unlocks at ${item.unlock} XP` : item.label}
                key={item.id}
              >
                <span>
                  <Button
                    variant="outlined"
                    disabled={isLocked}
                    sx={{
                      width: { xs: 70, sm: 80 },
                      height: { xs: 70, sm: 80 },
                      maxWidth: { xs: 70, sm: 80 },
                      minWidth: { xs: 70, sm: 80 },
                      p: 1,
                      mx: { xs: 0, sm: 1 },
                      borderColor: 'divider',
                      filter: isLocked ? 'grayscale(1)' : 'none',
                      opacity: isLocked ? 0.6 : 1,
                      position: 'relative',
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
                    {isLocked && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.unlock} XP
                      </Typography>
                    )}
                  </Button>
                </span>
              </Tooltip>
            )
          })}
        </Box>
      )}
    </>
  )
}

export default ScenePalette
