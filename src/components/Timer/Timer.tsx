import { Box, Button, Typography } from '@mui/material'
import type { FC } from 'react'
import { useTimerContext } from '../../contexts/timerContext/timerContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const Timer: FC = () => {
  const { time, isRunning } = useTimerContext()
  const { finishSession } = useReviewSession()
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
      {isRunning && (
        <Button
          variant="contained"
          color="error"
          onClick={() => finishSession(0)}
          sx={{
            px: isMobile ? 1.5 : 3,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            minWidth: isMobile ? 64 : 88,
          }}
        >
          End Session
        </Button>
      )}
    </Box>
  )
}

export default Timer
