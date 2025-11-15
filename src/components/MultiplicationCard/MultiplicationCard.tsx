import type { FC, KeyboardEvent } from 'react'
import { useState } from 'react'

import { Box, Card, Grid, TextField, Typography } from '@mui/material'
import useFirebase from '../../contexts/firebase/useFirebase'

export const MultiplicationCard: FC = () => {
  const { userCards } = useFirebase()
  const [answer, setAnswer] = useState('')

  // pick the first user card if available otherwise fallback
  const card = userCards && userCards.length ? userCards[0] : null

  const { top, bottom } = card || {}
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>
  ) => {
    if (e.key === 'Enter') {
      console.log(e.key)
    }
  }

  console.log({ card })
  return (
    <Box display="flex">
      <Card sx={{ padding: 4 }}>
        <Grid container spacing={2}>
          <Grid size={6} />

          <Grid size={6}>
            <Typography variant="h3" align="right">
              {top}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="h3">X</Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="h3" align="right">
              {bottom}
            </Typography>
          </Grid>

          <Grid size={6} />

          <Grid size={6}>
            <Typography variant="h3" align="right">
              <TextField
                type="number"
                value={answer}
                onKeyDown={handleKeyDown}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </Box>
  )
}
