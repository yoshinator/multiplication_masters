import { useEffect, useRef, useState, type FC, type FormEvent } from 'react'
import { Box, Button, Card, Grid, TextField, Typography } from '@mui/material'
import { useTimerContext } from '../../contexts/timer/timerContext'
import Timer from '../Timer/Timer'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import {
  BOX_ADVANCE,
  BOX_REGRESS,
  BOX_STAY,
} from '../../constants/appConstants'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'

// --- ZONE TIMER SUB-COMPONENT ---
const ZoneTimer: FC<{ time: number; maxTime: number }> = ({
  time,
  maxTime,
}) => {
  const progressPercent = Math.min(Math.max((time / maxTime) * 100, 0), 100)

  // Snap to start if resetting
  const isResetting = time >= maxTime - 0.1

  return (
    <Box
      sx={{
        position: 'relative',
        height: 12,
        width: '100%',
        mt: 0,
        bgcolor: 'grey.300', // The color of the "empty" track
      }}
    >
      {/* Layer 1: The Colored Zones (Background) 
         UPDATED: Switched to Vivid colors (Main/Dark/Light) instead of Pastels
      */}
      <Box
        sx={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* 0-15%: Deep Red */}
        <Box sx={{ width: '15%', bgcolor: 'error.main' }} />

        {/* 15-XX%: Orange-Red (Vivid) instead of Warning.Main */}
        <Box sx={{ flex: 1, bgcolor: 'error.light' }} />

        {/* XX-XX%: Amber (Vivid) instead of Warning.Light */}
        <Box sx={{ flex: 1, bgcolor: 'warning.main' }} />

        {/* End: Green */}
        <Box sx={{ flex: 2, bgcolor: 'success.main' }} />
      </Box>

      {/* Layer 2: The "Curtain" (The Active Bar Indicator) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progressPercent}%`,
          // Changed to fully transparent so it doesn't lighten the colors below
          bgcolor: 'transparent',
          borderRight: '2px solid white',
          transition: isResetting ? 'none' : 'width 0.1s linear',
          zIndex: 2,
        }}
      />

      {/* Layer 3: The "Future/Empty" area 
         UPDATED: Increased opacity so the "future" colors don't bleed through
         and wash out the look.
      */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: `${100 - progressPercent}%`,
          bgcolor: 'grey.300', // Solid grey looks cleaner than semi-transparent white
          opacity: 1, // Solid opacity prevents "ghosting"
          zIndex: 3,
          transition: isResetting ? 'none' : 'width 0.1s linear',
        }}
      />
    </Box>
  )
}

const MultiplicationCard: FC = () => {
  // COMPONENT STATE
  const [answer, setAnswer] = useState('')
  const [cardColor, setCardColor] = useState('background.paper')
  const { isShowingAnswer, showAnswer, hideAnswer } = useReviewSession()

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
    if (currentCard && !isShowingAnswer) {
      startTimer()
    }
  }, [currentCard?.id, isShowingAnswer, startTimer])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isShowingAnswer && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [currentCard, isShowingAnswer])

  useEffect(() => {
    if (isShowingAnswer) return
    const expired = prevTimeRef.current > 0 && time <= 0
    prevTimeRef.current = time

    if (expired && currentCard) {
      stopTimer()
      showAnswer()
      setCardColor('error.main')
    }
  }, [time, showAnswer, currentCard, stopTimer, isShowingAnswer])

  const handleResume = () => {
    hideAnswer()
    setCardColor('background.paper')
    setAnswer('')
    if (!currentCard) return

    resetTimer()
    startTimer()
    submitAnswer(currentCard, false, getElapsed())
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!answer || !currentCard) return

    const correct = Number(answer) === value
    let color: string = 'background.paper'

    if (correct) {
      const elapsed = getElapsed()
      if (elapsed <= BOX_ADVANCE) color = 'success.main'
      else if (elapsed <= BOX_STAY) color = 'warning.light'
      else color = 'warning.main'
    } else {
      showAnswer()
      setCardColor('error.main')
      stopTimer()
      return
    }

    setCardColor(color)

    resetTimer()

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
          minWidth: 450,
          maxWidth: 450,
          backgroundColor: cardColor,
          transition: 'background-color 0.35s ease, transform 0.35s ease',
          transform:
            cardColor !== 'background.paper' ? 'scale(1.03)' : 'scale(1)',
          backfaceVisibility: 'hidden',
          minHeight: 420,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              borderRadius: '50%',
              width: 24,
              height: 24,
              backgroundColor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="background.paper">
              {currentCard.box}
            </Typography>
          </Box>
          <Box
            sx={{
              borderRadius: '50%',
              width: 24,
              height: 24,
              backgroundColor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="background.paper">
              {estimatedReviews}
            </Typography>
          </Box>
        </Box>

        <Timer />

        <ZoneTimer time={time} maxTime={BOX_REGRESS} />

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={12}>
            <Typography
              variant="h2"
              align="center"
              sx={{ fontSize: '3.4rem', fontWeight: 800 }}
            >
              {top} × {bottom}
            </Typography>
          </Grid>

          <Grid size={12} sx={{ minHeight: 150 }}>
            {isShowingAnswer ? (
              <Box textAlign="center">
                <Typography variant="h5" mt={2} sx={{ opacity: 0.9 }}>
                  Correct: <strong>{value}</strong>
                </Typography>
                <Typography variant="h5" mt={2} sx={{ opacity: 0.9 }}>
                  Your answer:{' '}
                  <strong>{answer.length ? answer : '(Blank)'}</strong>
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
                  fullWidth
                  inputRef={inputRef}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setAnswer(val)
                  }}
                  sx={{
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '& .MuiOutlinedInput-input': {
                      fontSize: '3.8rem',
                      textAlign: 'center',
                      paddingY: 2,
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
