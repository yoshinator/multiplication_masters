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
import LevelUpAnimation from '../LevelUpAnimation/LevelUpAnimation'
import {
  BOX_ADVANCE,
  BOX_REGRESS,
  BOX_STAY,
  MAX_NEW_CARDS_PER_DAY,
  NEW_CARDS_PER_DAY_OPTIONS,
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

type Props = {
  backgroundImageUrl?: string | null
}

const MultiplicationCard: FC<Props> = ({ backgroundImageUrl }) => {
  // COMPONENT STATE
  const [answer, setAnswer] = useState('')
  const [cardColor, setCardColor] = useState('background.paper')
  const { isShowingAnswer, showAnswer, hideAnswer } = useReviewSession()
  const [limitIncreased, setLimitIncreased] = useState(false)
  const [showBonusAnimation, setShowBonusAnimation] = useState(false)

  // REFS
  const timeoutRef = useRef<number | null>(null)
  const bonusTimeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // HOOKS
  const { startTimer, resetTimer, stopTimer, getTime, isRunning } =
    useTimerActions()
  const { currentFact, submitAnswer, estimatedReviews } =
    useCardSchedulerContext()
  const { setIsSessionActive } = useSessionStatusContext()
  const { user, updateUser } = useUser()
  const isMobile = useIsMobile()

  const top = currentFact?.operands[0]
  const bottom = currentFact?.operands[1]
  const value = currentFact?.answer

  const expectedLength = value != null ? String(value).length : 0
  const reviewsLeftForCard = Math.max(1, 4 - (currentFact?.box ?? 1))

  const getElapsed = useCallback(() => BOX_REGRESS - getTime(), [getTime])

  useEffect(() => {
    if (currentFact && !isShowingAnswer) {
      startTimer()
    }
  }, [currentFact, isShowingAnswer, startTimer])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (bonusTimeoutRef.current) clearTimeout(bonusTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isShowingAnswer && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else if (isShowingAnswer && buttonRef.current) {
      setTimeout(() => buttonRef.current?.focus(), 50)
    }
  }, [currentFact, isShowingAnswer])

  useEffect(() => {
    if (isShowingAnswer) return
    // If timer stopped and time is 0, it expired
    if (!isRunning && currentFact && getTime() <= 0) {
      showAnswer()
      setCardColor('error.main')
    }
  }, [isRunning, showAnswer, currentFact, getTime, isShowingAnswer])

  const handleResume = () => {
    hideAnswer()
    setCardColor('background.paper')
    setAnswer('')
    if (!currentFact) return

    submitAnswer(currentFact, false, getElapsed())
    resetTimer()
    startTimer()
  }

  const handleAutoSubmit = useCallback(() => {
    if (!answer || !currentFact) return

    const correct = Number(answer) === value
    const elapsed = getElapsed()
    let color: string = 'background.paper'

    if (correct) {
      const isBonusRecovery =
        !currentFact.wasLastReviewCorrect && currentFact.seen > 0

      if (isBonusRecovery) {
        setShowBonusAnimation(true)
        if (bonusTimeoutRef.current) clearTimeout(bonusTimeoutRef.current)
        bonusTimeoutRef.current = window.setTimeout(() => {
          setShowBonusAnimation(false)
        }, 3000)
      }

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
    submitAnswer(currentFact, true, elapsed)
    setAnswer('')

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setCardColor('background.paper')
      timeoutRef.current = null
    }, 700)
  }, [
    answer,
    currentFact,
    value,
    getElapsed,
    resetTimer,
    setAnswer,
    showAnswer,
    stopTimer,
    setShowBonusAnimation,
    submitAnswer,
  ])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleAutoSubmit()
  }

  useEffect(() => {
    if (!currentFact) return
    if (isShowingAnswer) return
    if (answer.length === 0) return

    // Auto-submit when input length matches expected answer length
    if (answer.length === expectedLength) {
      handleAutoSubmit()
    }
  }, [answer, expectedLength, currentFact, isShowingAnswer, handleAutoSubmit])

  const currentLimit = user?.maxNewCardsPerDay ?? MAX_NEW_CARDS_PER_DAY
  const nextLimit = NEW_CARDS_PER_DAY_OPTIONS.find((opt) => opt > currentLimit)

  const handleIncreaseLimit = () => {
    if (nextLimit) {
      updateUser({ maxNewCardsPerDay: nextLimit })
      setLimitIncreased(true)
    }
  }

  if (!currentFact) {
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
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          {/* Background Image Layer */}
          {backgroundImageUrl && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
              }}
            />
          )}
          {/* Overlay Layer */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'background.paper',
              opacity: backgroundImageUrl ? 0 : 1,
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              display: 'flex',
              minHeight: 0,
              flexDirection: 'column',
              alignItems: 'center',
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
                <Typography
                  variant="body2"
                  color="success.main"
                  fontWeight={600}
                >
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
          </Box>
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
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.35s ease',
          transform:
            cardColor !== 'background.paper' ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Background Image Layer */}
        {backgroundImageUrl && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0,
            }}
          />
        )}

        {/* Color/Feedback Overlay Layer */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: cardColor,
            opacity: backgroundImageUrl
              ? cardColor === 'background.paper'
                ? 0.2
                : 0.8
              : 1,
            transition: 'background-color 0.35s ease, opacity 0.35s ease',
            zIndex: 1,
          }}
        />

        {/* Content Wrapper */}
        <Box sx={{ position: 'relative', zIndex: 2, width: '100%' }}>
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

            <Grid size={12} sx={{ minHeight: isMobile ? 95 : 150 }}>
              {isShowingAnswer ? (
                <Box textAlign="center">
                  <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    sx={{
                      opacity: 0.9,
                      mt: { xs: 0, sm: 1 },
                      lineHeight: isMobile ? 1.2 : 1.5,
                    }}
                  >
                    Correct: <strong>{value}</strong>
                  </Typography>
                  <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    sx={{
                      opacity: 0.9,
                      mt: { xs: 0, sm: 1 },
                      mx: { xs: 1, sm: undefined },
                      lineHeight: isMobile ? 1.2 : 1.5,
                    }}
                  >
                    Your answer:{' '}
                    <Box
                      component="span"
                      textAlign="left"
                      display="inline-block"
                      minWidth="7ch"
                    >
                      <strong>{answer.length ? answer : '(Blank)'}</strong>
                    </Box>
                  </Typography>

                  {cardColor === 'error.main' && (
                    <>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: 'warning.main',
                          fontWeight: 800,
                          mt: 1,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        ⭐️ Bonus Token 2XP.
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        Get it by answering this correctly next time
                      </Typography>
                    </>
                  )}

                  <Button
                    ref={buttonRef}
                    variant="contained"
                    fullWidth
                    onClick={handleResume}
                    sx={{
                      mt: isMobile ? 0.5 : 1,
                      py: isMobile ? 0.5 : 1,
                      fontSize: isMobile ? '1rem' : '1.2rem',
                    }}
                  >
                    Continue
                  </Button>
                </Box>
              ) : (
                <form onSubmit={handleSubmit} autoComplete="off">
                  <TextField
                    id="game-input"
                    value={answer}
                    fullWidth
                    autoComplete="off"
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
                        paddingY: 1.25,
                        textAlign: 'center',
                      },
                    }}
                  />
                </form>
              )}
            </Grid>
          </Grid>
          <LevelUpAnimation
            isVisible={showBonusAnimation}
            title="✨ Bonus XP Success! ✨"
            color="#FFD700"
          />
        </Box>
      </Card>
    </Box>
  )
}

export default MultiplicationCard
