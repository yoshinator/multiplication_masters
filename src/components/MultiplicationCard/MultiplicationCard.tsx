import type { FC, KeyboardEvent } from 'react'
import { useEffect, useState } from 'react'

import { Box, Card, Grid, TextField, Typography } from '@mui/material'
import useFirebase from '../../contexts/firebase/useFirebase'
import useCardScheduler from '../../hooks/useCardScheduler'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { useLogger } from '../../hooks/useLogger'

export const MultiplicationCard: FC = () => {
  const { userCards } = useFirebase()
  const [answer, setAnswer] = useState('')
  const logger = useLogger()

  const { time, startTimer, resetTimer } = useTimerContext()
  const { currentCard, getNextCard, queue, submitAnswer } =
    useCardScheduler(userCards)

  // Start timer automatically when new card loads
  useEffect(() => {
    if (currentCard) {
      resetTimer()
      startTimer()
    }
  }, [currentCard, resetTimer, startTimer])

  // If no card is ready yet
  if (!currentCard) {
    return (
      <Typography variant="h4" textAlign="center">
        Loading cards...
      </Typography>
    )
  }

  const { top, bottom, value } = currentCard

  const handleSubmit = () => {
    if (answer === '') return

    const userAnswer = Number(answer)
    const correct = userAnswer === value

    // time is from 7 → 0 (means elapsed = 7 - time)
    const elapsed = (7 - time) * 1000 // convert to ms

    submitAnswer(currentCard, correct, elapsed)

    // Persist to Firebase

    // Move to next card
    getNextCard()

    // Reset UI
    setAnswer('')
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>
  ) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  logger(queue)
  return (
    <Box display="flex" justifyContent="center" mt={6}>
      <Card sx={{ padding: 4, minWidth: 300 }}>
        <Grid container spacing={2}>
          {/* Problem Display */}
          <Grid>
            <Typography variant="h2" align="center">
              {top} × {bottom}
            </Typography>
          </Grid>

          {/* Timer */}
          <Grid>
            <Typography variant="h5" textAlign="center" sx={{ opacity: 0.7 }}>
              Time: {time.toFixed(1)}s
            </Typography>
          </Grid>

          {/* Input */}
          <Grid>
            <TextField
              type="number"
              value={answer}
              autoFocus
              fullWidth
              onKeyDown={handleKeyDown}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </Grid>
        </Grid>
      </Card>
    </Box>
  )
}
