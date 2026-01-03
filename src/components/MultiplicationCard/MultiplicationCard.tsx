import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type FormEvent,
} from 'react'
import {
  Box,
  Button,
  Card,
  Grid,
  TextField,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material'
import { useTimerActions } from '../../contexts/timerContext/timerContext'
import Timer from '../Timer/Timer'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import {
  BOX_ADVANCE,
  BOX_REGRESS,
  BOX_STAY,
} from '../../constants/appConstants'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import ZoneTimer from './ZoneTimer'
import { useIsMobile } from '../../hooks/useIsMobile'
import LayersIcon from '@mui/icons-material/Layers'
import RepeatIcon from '@mui/icons-material/Repeat'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useUser } from '../../contexts/userContext/useUserContext'

const MultiplicationCard: FC = () => {
  // COMPONENT STATE
  const [answer, setAnswer] = useState('')
  const [cardColor, setCardColor] = useState('background.paper')
  const { isShowingAnswer, showAnswer, hideAnswer } = useReviewSession()
  const [limitIncreased, setLimitIncreased] = useState(false)

  // REFS
  const timeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // HOOKS
  const { startTimer, resetTimer, stopTimer, getTime, isRunning } =
    useTimerActions()
  const { currentCard, submitAnswer, estimatedReviews } =
    useCardSchedulerContext()
  const { setIsSessionActive } = useSessionStatusContext()
  const { user, updateUser } = useUser()
  const isMobile = useIsMobile()

  const { top, bottom, value } = currentCard ?? {}
  const expectedLength = value != null ? String(value).length : 0
  const reviewsLeftForCard = Math.max(1, 4 - (currentCard?.box ?? 1))

  const getElapsed = useCallback(() => BOX_REGRESS - getTime(), [getTime])

  useEffect(() => {
    if (currentCard && !isShowingAnswer) {
      startTimer()
    }
  }, [currentCard, isShowingAnswer, startTimer])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isShowingAnswer && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else if (isShowingAnswer && buttonRef.current) {
      setTimeout(() => buttonRef.current?.focus(), 50)
    }
  }, [currentCard, isShowingAnswer])

  useEffect(() => {
    if (isShowingAnswer) return
    // If timer stopped and time is 0, it expired
    if (!isRunning && currentCard && getTime() <= 0) {
      showAnswer()
      setCardColor('error.main')
    }
  }, [isRunning, showAnswer, currentCard, getTime, isShowingAnswer])

  const handleResume = () => {
    hideAnswer()
    setCardColor('background.paper')
    setAnswer('')
    if (!currentCard) return

    submitAnswer(currentCard, false, getElapsed())
    resetTimer()
    startTimer()
  }

  const handleAutoSubmit = useCallback(() => {
    if (!answer || !currentCard) return

    const correct = Number(answer) === value
    const elapsed = getElapsed()
    let color: string = 'background.paper'

    if (correct) {
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
    submitAnswer(currentCard, true, elapsed)
    setAnswer('')

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setCardColor('background.paper')
      timeoutRef.current = null
    }, 700)
  }, [
    answer,
    currentCard,
    value,
    getElapsed,
    resetTimer,
    setAnswer,
    showAnswer,
    stopTimer,
    submitAnswer,
  ])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleAutoSubmit()
  }

  useEffect(() => {
    if (!currentCard) return
    if (isShowingAnswer) return
    if (answer.length === 0) return

    // Auto-submit when input length matches expected answer length
    if (answer.length === expectedLength) {
      handleAutoSubmit()
    }
  }, [answer, expectedLength, currentCard, isShowingAnswer, handleAutoSubmit])

  const currentLimit = user?.maxNewCardsPerDay ?? 10
  const nextLimit = [5, 10, 15, 20].find((opt) => opt > currentLimit)

  const handleIncreaseLimit = () => {
    if (nextLimit) {
      updateUser({ maxNewCardsPerDay: nextLimit })
      setLimitIncreased(true)
    }
  }

  if (!currentCard) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mt={isMobile ? 2 : 6}
        px={isMobile ? 1 : 2}
        flexDirection="column"
      >
        <Card
          sx={{
            p: isMobile ? 3 : 5,
            width: '100%',
            maxWidth: 450,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <CheckCircleOutlineIcon
            color="success"
            sx={{ fontSize: isMobile ? 60 : 80 }}
          />
          <Typography variant="h4" fontWeight={700}>
            Great Job!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You've finished all your cards for now. Come back later for more!
          </Typography>

          <Box
            sx={{
              bgcolor: 'action.hover',
              p: 2,
              borderRadius: 2,
              mt: 1,
              width: '100%',
            }}
          >
            <Typography variant="subtitle2" gutterBottom fontWeight={700}>
              Daily Limit: {currentLimit} New Cards
            </Typography>

            {limitIncreased ? (
              <Typography variant="body2" color="success.main" fontWeight={600}>
                Done! Go back to the dashboard to play.
              </Typography>
            ) : nextLimit ? (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Want to learn faster? Upgrade to {nextLimit} cards per day.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleIncreaseLimit}
                  startIcon={<AddCircleOutlineIcon />}
                  fullWidth
                  sx={{ bgcolor: 'background.paper' }}
                >
                  Upgrade to {nextLimit} New Cards
                </Button>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                You are on the highest setting. Amazing work!
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => setIsSessionActive(false)}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      mt={isMobile ? 2 : 6}
      px={isMobile ? 1 : 2}
      flexDirection="column"
    >
      <Card
        id="game-card"
        sx={{
          p: isMobile ? 2 : 4,
          width: '100%',
          maxWidth: isMobile ? 340 : 450,
          minHeight: isMobile ? 'auto' : 420,
          backgroundColor: cardColor,
          transition: 'background-color 0.35s ease, transform 0.35s ease',
          transform:
            cardColor !== 'background.paper' ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: isMobile ? 1 : 2,
            alignItems: 'center',
          }}
        >
          <Tooltip
            title="Estimated total reviews remaining in this session"
            arrow
          >
            <Chip
              id="estimated-reviews"
              icon={<LayersIcon />}
              label={
                isMobile
                  ? `${estimatedReviews} left`
                  : `Session: ${estimatedReviews}`
              }
              size="small"
              variant="outlined"
              sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}
            />
          </Tooltip>

          <Tooltip
            title="Times you must answer this card correctly to finish it today"
            arrow
          >
            <Chip
              id="reviews-left"
              icon={<RepeatIcon />}
              label={
                isMobile
                  ? `${reviewsLeftForCard}x card`
                  : `Card: ${reviewsLeftForCard}x left`
              }
              size="small"
              variant="outlined"
              color={reviewsLeftForCard === 1 ? 'success' : 'default'}
              sx={{
                bgcolor: 'background.paper',
                borderColor:
                  reviewsLeftForCard === 1 ? 'success.main' : 'divider',
              }}
            />
          </Tooltip>
        </Box>
        <Box id="game-timer">
          <Timer />
          <ZoneTimer maxTime={BOX_REGRESS} />
        </Box>

        <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mt: 1 }}>
          <Grid size={12}>
            <Typography
              align="center"
              sx={{
                fontSize: isMobile ? '2.4rem' : '3.4rem',
                fontWeight: 800,
              }}
            >
              {top} × {bottom}
            </Typography>
          </Grid>

          <Grid size={12} sx={{ minHeight: isMobile ? 90 : 150 }}>
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
                  ref={buttonRef}
                  variant="contained"
                  fullWidth
                  onClick={handleResume}
                  sx={{
                    mt: 1.5,
                    py: isMobile ? 1 : 1.5,
                    fontSize: isMobile ? '1rem' : '1.2rem',
                  }}
                >
                  Continue
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  id="game-input"
                  value={answer}
                  fullWidth
                  inputRef={inputRef}
                  slotProps={{
                    htmlInput: {
                      inputMode: 'numeric',
                    },
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                    }
                  }}
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
                      fontSize: isMobile ? '2.25rem' : '3.8rem',
                      paddingY: isMobile ? 1.25 : 2,
                      textAlign: 'center',
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
