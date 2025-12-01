import { useState, type FC } from 'react'
import { useSceneBuilder } from './sceneBuilderContext'
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { SCENES } from '../../constants/sceneDefinitions'

const ScenePalette: FC = () => {
  const { theme, unlockedItemIds, addObject } = useSceneBuilder()
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
              <Stack spacing={1} sx={{ mt: 1 }}>
                {items.map((item) => (
                  <Button
                    key={item.id}
                    variant="outlined"
                    size="small"
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    onClick={() => addObject(item)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </Collapse>
          </Box>
        )
      })}
    </>
  )
}

export default ScenePalette
