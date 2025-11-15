import { type FC } from 'react'
import { useTimerContext } from '../../contexts/timer/timerContext'
import { Box, Button, Typography } from '@mui/material'

export const Timer: FC = () => {
  const { time, stopTimer, startTimer, resetTimer } = useTimerContext()

  startTimer()
  return (
    <Box>
      <Box display={'flex'}>
        <Button onClick={startTimer}>resume</Button>
        <Button onClick={stopTimer}>stop</Button>
        <Button onClick={resetTimer}>reset</Button>
      </Box>

      <Typography textAlign="center" variant="h4">
        {time}
      </Typography>
    </Box>
  )
}
