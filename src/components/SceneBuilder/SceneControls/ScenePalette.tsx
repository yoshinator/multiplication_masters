import { useState, type FC } from 'react'
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import {
  SCENES,
  type SceneItemDefinition,
  type SceneTheme,
} from '../../../constants/sceneDefinitions'

interface Props {
  theme: SceneTheme
  unlockedItemIds: string[]
  addObject: (def: SceneItemDefinition) => void
  onClickCallBack?: () => void
}

const ScenePalette: FC<Props> = ({
  theme,
  unlockedItemIds,
  addObject,
  onClickCallBack,
}) => {
  const sceneDef = SCENES[theme]

  const [open, setOpen] = useState(() =>
    Object.fromEntries(sceneDef.categories.map((c) => [c.id, true]))
  )

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {sceneDef.label} Builder
      </Typography>

      {sceneDef.categories.map((cat) => {
        const items = cat.items.filter((it) => unlockedItemIds.includes(it.id))
        if (items.length === 0) return null

        return (
          <Box key={cat.id} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1">{cat.label}</Typography>
              <IconButton
                size="small"
                onClick={() =>
                  setOpen((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                }
              >
                {open[cat.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>

            <Collapse in={open[cat.id]}>
              <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {items.map((item) => (
                  <Tooltip title={item.label} key={item.id}>
                    <Button
                      variant="outlined"
                      sx={{
                        width: 80,
                        height: 80,
                        minWidth: 80,
                        p: 1,
                        borderColor: 'divider',
                      }}
                      onClick={() => {
                        addObject(item)
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
            </Collapse>
          </Box>
        )
      })}
    </>
  )
}

export default ScenePalette
