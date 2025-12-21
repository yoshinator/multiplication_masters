import { Box, Button, Typography } from '@mui/material'
import type { FC } from 'react'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const Timer: FC = () => {
  const { currentCard } = useCardSchedulerContext()
  const { time, isRunning, startTimer, stopTimer, resetTimer } =
    useTimerContext()
  const { isShowingAnswer } = useReviewSession()
  const isMobile = useIsMobile()
  const circleSize = isMobile ? 40 : 150
  const borderSize = isMobile ? 3 : 6

  // convert ms → whole seconds
  const seconds = Math.ceil(time / 1000)

  return (
    <Box
      sx={{
        textAlign: 'center',
        mb: isMobile ? 1.5 : 3,
        mt: isMobile ? 0.5 : 1,
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        justifyContent: isMobile ? 'center' : 'inherit',
        alignItems: 'center',
        gap: isMobile ? 1 : 2,
      }}
    >
      {/* BIG CIRCLE + NUMBER */}
      <Box
        sx={{
          width: circleSize,
          height: circleSize,
          borderRadius: '50%',
          border: `${borderSize}px solid`,
          borderColor: isRunning ? 'primary.main' : 'grey.500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRunning ? 'primary.main' : 'grey.500',
        }}
      >
        <Typography
          sx={{
            fontSize: isMobile ? '1.25rem' : '2.2rem',
            fontWeight: 800,
            color: isRunning ? 'primary.contrastText' : 'inherit',
            lineHeight: 1,
          }}
        >
          {seconds}
        </Typography>
      </Box>

      {/* CONTROLS */}
      <Box display="flex" gap={isMobile ? 0.5 : 1}>
        {!isRunning && !isShowingAnswer && (
          <Button
            variant="contained"
            color="primary"
            onClick={startTimer}
            sx={{
              px: isMobile ? 1.5 : 3,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 64 : 88,
            }}
          >
            {currentCard ? 'Resume' : 'Start'}
          </Button>
        )}

        {isRunning && (
          <Button
            variant="outlined"
            color="warning"
            onClick={stopTimer}
            sx={{
              px: isMobile ? 1.5 : 3,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 64 : 88,
            }}
          >
            Stop
          </Button>
        )}

        {!isMobile && (
          <Button
            variant="outlined"
            color="error"
            onClick={resetTimer}
            sx={{
              px: isMobile ? 1.5 : 3,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 64 : 88,
            }}
          >
            Reset
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default Timer
