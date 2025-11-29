import { useEffect, useRef, useState, type FC, type FormEvent } from 'react'
import {
  Box,
  Button,
  Card,
  Grid,
  TextField,
  Typography,
  LinearProgress,
} from '@mui/material'
import { useTimerContext } from '../../contexts/timer/timerContext'

import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import {
  BOX_ADVANCE,
  BOX_REGRESS,
  BOX_STAY,
} from '../../constants/appConstants'

const MultiplicationCard: FC = () => {
  // COMPONENT STATE
  const [answer, setAnswer] = useState('')
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [cardColor, setCardColor] = useState('background.paper')
  // REFS
  const timeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // HOOKS
  const { time, startTimer, resetTimer, stopTimer } = useTimerContext()
  const prevTimeRef = useRef(time)
  const { currentCard, submitAnswer, estimatedReviews } =
    useCardSchedulerContext()
  const { top, bottom, value } = currentCard ?? {}

  const getElapsed = () => BOX_REGRESS - time

  useEffect(() => {
    if (currentCard && !showCorrectAnswer) {
      resetTimer()
      startTimer()
    }
  }, [currentCard, showCorrectAnswer, startTimer, resetTimer])

  // Cleanup any left over timeouts after unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Force focus when a new card appears or we resume
  useEffect(() => {
    if (!showCorrectAnswer && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentCard, showCorrectAnswer])

  // Handles time expiration
  useEffect(() => {
    if (showCorrectAnswer) return

    // Did we JUST cross from >0 to <=0?
    const expired = prevTimeRef.current > 0 && time <= 0

    // Update the previous time after comparing
    prevTimeRef.current = time

    if (!expired || !currentCard) return

    // Handle expiration
    stopTimer()
    setShowCorrectAnswer(true)
    setCardColor('error.main')
    setAnswer('')
  }, [time, showCorrectAnswer, currentCard, stopTimer])

  const handleResume = () => {
    setShowCorrectAnswer(false)
    setCardColor('background.paper')
    setAnswer('')
    if (!currentCard) return
    submitAnswer(currentCard, false, getElapsed())
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!answer || !currentCard) return

    const correct = Number(answer) === value

    let color: string = 'background.paper'

    if (correct) {
      if (getElapsed() <= BOX_ADVANCE) color = 'success.main'
      else if (getElapsed() <= BOX_STAY) color = 'warning.light'
      else color = 'warning.main'
    } else {
      setShowCorrectAnswer(true)
      setCardColor('error.main')
      stopTimer()
      return
    }

    setCardColor(color)
    submitAnswer(currentCard, true, getElapsed())
    setAnswer('')

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(() => {
      setCardColor('background.paper')
      timeoutRef.current = null
    }, 700)
  }

  if (!currentCard) return null

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      mt={6}
      px={2}
    >
      <Card
        sx={{
          padding: 4,
          minWidth: 340,
          maxWidth: 450,
          backgroundColor: cardColor,
          transition: 'all 0.35s ease',
          transform:
            cardColor !== 'background.paper' ? 'scale(1.03)' : 'scale(1)',
        }}
      >
        {/* Cards Left & Box */}
        <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              height: 10,
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{
                borderRadius: '50%',
                width: 24,
                height: 24,
                backgroundColor: 'black',
              }}
            >
              <Typography textAlign="center" color="background.paper">
                {currentCard.box}
              </Typography>
            </Box>
            <Box
              sx={{
                borderRadius: '50%',
                width: 24,
                height: 24,
                backgroundColor: 'black',
              }}
            >
              <Typography textAlign="center" color="background.paper">
                {estimatedReviews}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Timer Bar (progress) */}
        <Box sx={{ position: 'relative', width: '100%', mb: 0 }}>
          <Box sx={{ display: 'flex', height: 10, width: '100%' }}>
            <Box sx={{ width: 2, backgroundColor: 'error.main' }} />
            {/* 4–7s (slow) */}
            <Box sx={{ flex: '3 0 auto', backgroundColor: 'warning.main' }} />
            {/* 2–4s (medium) */}
            <Box sx={{ flex: '2 0 auto', backgroundColor: 'warning.light' }} />
            {/* 0–2s (fast) */}
            <Box sx={{ flex: '2 0 auto', backgroundColor: 'success.main' }} />
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={(time / BOX_REGRESS) * 100}
          sx={{ height: 10, borderRadius: 0 }}
        />

        <Grid container spacing={3}>
          <Grid size={12}>
            <Typography
              variant="h2"
              align="center"
              sx={{ fontSize: '3.4rem', fontWeight: 800 }}
            >
              {top} × {bottom}
            </Typography>
          </Grid>

          {/* Input or correct answer */}
          <Grid size={12} sx={{ minHeight: 150 }}>
            {showCorrectAnswer ? (
              <Box textAlign="center">
                <Typography variant="h5" mt={2} sx={{ opacity: 0.9 }}>
                  Correct: <strong>{value}</strong>
                </Typography>
                <Typography variant="h5" mt={2} sx={{ opacity: 0.9 }}>
                  Your answer: <strong>{answer}</strong>
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleResume}
                  sx={{ mt: 2, py: 1.5, fontSize: '1.2rem' }}
                >
                  Continue
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  type="number"
                  value={answer}
                  autoFocus
                  fullWidth
                  inputRef={inputRef}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setAnswer(val)
                  }}
                  sx={{
                    // Remove number spinner
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                    },
                    '& input[type=number]::-webkit-outer-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },

                    // Answer input styling
                    '& .MuiOutlinedInput-input': {
                      fontSize: '3.8rem',
                      textAlign: 'center',
                      paddingY: 8,
                      caretColor: '#2962ff',
                    },
                  }}
                />
              </form>
            )}
          </Grid>
        </Grid>
      </Card>
    </Box>
  )
}

export default MultiplicationCard
