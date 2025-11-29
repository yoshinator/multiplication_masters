import { Box, Button, Typography } from '@mui/material'
import type { FC } from 'react'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'

interface Props {
  sessionLength: number
}

const Timer: FC<Props> = ({ sessionLength }) => {
  const { startSession, currentCard } = useCardSchedulerContext()
  const { time, isRunning, startTimer, stopTimer, resetTimer } =
    useTimerContext()
  const { isSessionActive } = useReviewSession()

  // convert ms → whole seconds
  const seconds = Math.ceil(time / 1000)

  return (
    <Box
      sx={{
        textAlign: 'center',
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        mt: 1,
      }}
    >
      {/* BIG CIRCLE + NUMBER */}
      <Box
        sx={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '6px solid',
          borderColor: isRunning ? 'primary.main' : 'grey.500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRunning ? 'primary.main' : 'grey.500',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: isRunning ? 'primary.contrastText' : 'inherit',
            fontWeight: 800,
            letterSpacing: '-1px',
          }}
        >
          {seconds}
        </Typography>
      </Box>

      {/* CONTROLS */}
      <Box display="flex" gap={1}>
        {!isRunning && (
          <Button
            variant="contained"
            color="primary"
            onClick={
              isSessionActive ? startTimer : () => startSession(sessionLength)
            }
            sx={{ px: 3 }}
          >
            {currentCard ? 'Resume' : 'Start'}
          </Button>
        )}

        {isRunning && (
          <Button
            variant="outlined"
            color="warning"
            onClick={stopTimer}
            sx={{ px: 3 }}
          >
            Stop
          </Button>
        )}

        <Button
          variant="outlined"
          color="error"
          onClick={resetTimer}
          sx={{ px: 3 }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  )
}

export default Timer
