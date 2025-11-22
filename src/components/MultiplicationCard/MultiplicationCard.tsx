import { useEffect, useRef, useState, type FC, type FormEvent } from 'react'
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  LinearProgress,
} from '@mui/material'

import useFirebase from '../../contexts/firebase/useFirebase'
import useCardScheduler from '../../hooks/useCardScheduler'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { useUser } from '../../contexts/user/useUserContext'

const MultiplicationCard: FC = () => {
  const { userCards } = useFirebase()
  const [answer, setAnswer] = useState('')
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const { time, startTimer, resetTimer, stopTimer } = useTimerContext()
  const prevTimeRef = useRef(time)
  const { user } = useUser()
  const { currentCard, submitAnswer } = useCardScheduler(userCards, user)

  const [cardColor, setCardColor] = useState('background.paper')

  useEffect(() => {
    if (currentCard && !showCorrectAnswer) {
      resetTimer()
      startTimer()
    }
  }, [currentCard, showCorrectAnswer])

  const { top, bottom, value } = currentCard ?? {}

  const handleResume = () => {
    setShowCorrectAnswer(false)
    setCardColor('background.paper')
    setAnswer('')
  }

  useEffect(() => {
    if (showCorrectAnswer) return

    if (prevTimeRef.current > 0 && time <= 0 && currentCard) {
      submitAnswer(currentCard, false, 7000)
      setShowCorrectAnswer(true)
      setCardColor('error.main')
      setAnswer('')
    }

    prevTimeRef.current = time
  }, [time])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!answer || !currentCard) return

    const correct = Number(answer) === value
    const elapsedSeconds = 7 - time
    const elapsedMs = elapsedSeconds * 1000

    let color: string = 'background.paper'

    if (correct) {
      if (elapsedSeconds <= 2) color = 'success.main'
      else if (elapsedSeconds <= 4) color = 'warning.light'
      else color = 'warning.main'
    } else {
      submitAnswer(currentCard, false, elapsedMs)
      setCardColor('error.main')
      setShowCorrectAnswer(true)
      stopTimer()
      return
    }

    setCardColor(color)
    submitAnswer(currentCard, true, elapsedMs)
    setAnswer('')

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(() => {
      setCardColor('background.paper')
      timeoutRef.current = null
    }, 700)
  }

  if (!currentCard) {
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress />
      </Box>
    )
  }

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
        {/* Timer bar */}
        <Box sx={{ position: 'relative', width: '100%', mb: 0 }}>
          <Box
            sx={{
              display: 'flex',
              height: 10,
              width: '100%',
            }}
          >
            {/* “timeout zone” – tiny sliver */}
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
          value={(time / 7) * 100}
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
          <Grid size={12}>
            {showCorrectAnswer ? (
              <Box textAlign="center">
                <Typography variant="h5" mt={2} sx={{ opacity: 0.9 }}>
                  Correct: <strong>{value}</strong>
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
                  onChange={(e) => setAnswer(e.target.value)}
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
