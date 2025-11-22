import { FC } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { useTimerContext } from '../../contexts/timer/timerContext'

export const Timer: FC = () => {
  const { time, isRunning, startTimer, stopTimer, resetTimer } =
    useTimerContext()

  const percent = (time / 7) * 100

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
              percent > (4 / 7) * 100
                ? 'success.main'
                : percent > (2 / 7) * 100
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
        {!isRunning && time > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={startTimer}
            sx={{ px: 3 }}
          >
            Resume
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
