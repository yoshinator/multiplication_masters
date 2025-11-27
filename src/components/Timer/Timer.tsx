import { useEffect, type FC } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import {
  BOX_ADVANCE,
  BOX_REGRESS,
  BOX_STAY,
} from '../../constants/appConstants'

interface Props {
  sessionLength: number
}

const Timer: FC<Props> = ({ sessionLength }) => {
  const { startSession, currentCard } = useCardSchedulerContext()
  const { time, isRunning, startTimer, stopTimer, resetTimer } =
    useTimerContext()
  const { isSessionActive } = useReviewSession()

  const percent = (time / (BOX_REGRESS / 100)) * 100

  useEffect(() => {
    console.log({ time })
  }, [time])

  if (isRunning) {
    return
  }
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
      {/* Timer Ring + Number */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={percent}
          size={120}
          thickness={4}
          sx={{
            color:
              percent > (BOX_STAY / 1000 / (BOX_REGRESS / 1000)) * 100
                ? 'success.main'
                : percent > (BOX_ADVANCE / 1000 / (BOX_REGRESS / 1000)) * 100
                  ? 'warning.light'
                  : percent > 0
                    ? 'warning.main'
                    : 'error.main',
            transition: 'color 0.3s ease',
          }}
        />

        <Box
          sx={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.5px',
              opacity: 0.9,
              transition: 'all 0.2s ease',
            }}
          >
            {time.toFixed(1)}
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Box display="flex" gap={1}>
        {!isRunning && !isSessionActive && (
          <Button
            variant="contained"
            color="primary"
            onClick={
              currentCard ? startTimer : () => startSession(sessionLength)
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
