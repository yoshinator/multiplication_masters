import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react'

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
  const prevTimeRef = useRef(time)
  const { currentCard, getNextCard, queue, submitAnswer } =
    useCardScheduler(userCards)

  // Start timer automatically when new card loads
  useEffect(() => {
    if (currentCard) {
      resetTimer()
      startTimer()
    }
  }, [currentCard])

  const { top, bottom, value } = currentCard ?? {}
  useEffect(() => {
    if (prevTimeRef.current > 0 && time <= 0 && currentCard) {
      submitAnswer(currentCard, false, 7000)
      getNextCard()
      setAnswer('')
    }
    prevTimeRef.current = time
  }, [time, currentCard, submitAnswer, getNextCard])

  const handleSubmit = () => {
    if (answer.length && currentCard) {
      // time is from 7 → 0 (means elapsed = 7 - time)
      const elapsed = (7 - time) * 1000 // convert to ms
      const userAnswer = Number(answer)
      const correct = userAnswer === value

      submitAnswer(currentCard, correct, elapsed)

      // Persist to Firebase someday before getting next card. Or batch write em.
      getNextCard()

      // Reset UI
      setAnswer('')
    }
    return
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>
  ) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  logger(queue)
  return currentCard ? (
    <Box display="flex" justifyContent="center" mt={6}>
      <Card sx={{ padding: 4, minWidth: 300 }}>
        <Grid container spacing={2}>
          {/* Problem Display */}
          <Grid size={12}>
            <Typography variant="h2" align="center">
              {top} × {bottom}
            </Typography>
          </Grid>

          {/* Timer */}
          <Grid size={12}>
            <Typography variant="h5" textAlign="center" sx={{ opacity: 0.7 }}>
              Time: {time.toFixed(1)}s
            </Typography>
          </Grid>

          {/* Input */}
          <Grid size={12}>
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
  ) : (
    <Typography variant="h4" textAlign="center">
      Loading cards...
    </Typography>
  )
}
