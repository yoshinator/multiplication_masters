import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react'

import { Box, Button, Card, Grid, TextField, Typography } from '@mui/material'
import useFirebase from '../../contexts/firebase/useFirebase'
import useCardScheduler from '../../hooks/useCardScheduler'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { useUser } from '../../contexts/user/useUserContext'

export const MultiplicationCard: FC = () => {
  const { userCards } = useFirebase()
  const [answer, setAnswer] = useState('')
  const timeoutRef = useRef<number | null>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const { time, startTimer, resetTimer, stopTimer } = useTimerContext()
  const prevTimeRef = useRef(time)
  const { user } = useUser()
  const { currentCard, submitAnswer } = useCardScheduler(userCards, user)

  const [cardBackgroundColor, setCardBackgroundColor] = useState<
    'red' | 'green' | 'white' | 'yellow' | 'orange'
  >('white')

  useEffect(() => {
    if (!currentCard || showCorrectAnswer) {
      return
    }
    if (currentCard) {
      resetTimer()
      startTimer()
    }
  }, [currentCard, showCorrectAnswer])

  const { top, bottom, value } = currentCard ?? {}

  const handleResume = () => {
    setShowCorrectAnswer(false)
    setCardBackgroundColor('white')
    setAnswer('')
  }

  useEffect(() => {
    // Don't move forward while showing the answer
    if (showCorrectAnswer) {
      return
    }
    if (prevTimeRef.current > 0 && time <= 0 && currentCard) {
      submitAnswer(currentCard, false, 7000)
      setShowCorrectAnswer(true)
      setCardBackgroundColor('red')
      setAnswer('')
    }
    prevTimeRef.current = time
  }, [time, currentCard, submitAnswer])

  const handleSubmit = () => {
    if (answer.length && currentCard) {
      // time is from 7 → 0 (means elapsed = 7 - time)
      const correct = Number(answer) === value
      const elapsedSeconds = 7 - time
      const elapsedMs = elapsedSeconds * 1000

      /**
       *  Determine highlight color immediately
       *  SM2 + speed-based Leitner rules:
       * - < 2s → up 1 box
       * - 2–4s → stay
       * - 4–7s → down 2 boxes
       * - incorrect → box = 1
       * - > 7s → box = 1
       * (Note: box min = 1, max = 15)
       */
      let color: typeof cardBackgroundColor = 'white'
      if (correct) {
        if (elapsedSeconds <= 2) {
          color = 'green'
        } else if (elapsedSeconds <= 4) {
          color = 'yellow'
        } else {
          color = 'orange'
        }
      } else {
        // WRONG ANSWER BEHAVIOR
        submitAnswer(currentCard, false, elapsedMs)
        setCardBackgroundColor('red')
        setShowCorrectAnswer(true)
        stopTimer()
        return
      }

      setCardBackgroundColor(color)
      if (correct) {
        submitAnswer(currentCard, correct, elapsedMs)
        setAnswer('')
        // clear any previous revert timeout, then schedule revert to white
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = window.setTimeout(() => {
          setCardBackgroundColor('white')
          timeoutRef.current = null
        }, 1200) // show color briefly, then revert
      }
      return
    }
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>
  ) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  // logger(queue)
  return currentCard ? (
    <Box display="flex" justifyContent="center" mt={6}>
      <Card
        sx={{
          padding: 4,
          minWidth: 300,
          backgroundColor: cardBackgroundColor,
          transition: 'background-color 0.5s ease-in',
        }}
      >
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
            {showCorrectAnswer ? (
              <>
                <Typography variant="h6" color="error" mt={2}>
                  Correct answer: {value}
                </Typography>
                <Button variant="contained" onClick={handleResume}>
                  Resume
                </Button>
              </>
            ) : (
              <TextField
                type="number"
                value={answer}
                autoFocus
                fullWidth
                onKeyDown={handleKeyDown}
                onChange={(e) => setAnswer(e.target.value)}
              />
            )}
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
