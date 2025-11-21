import type { FC } from 'react'
import { Box, Toolbar, Typography } from '@mui/material'

import { MultiplicationCard } from './components/MultiplicationCard/MultiplicationCard'
import Header from './components/Header/Header'
import { TimerContextProvider } from './contexts/timer/TimerProvider'
import { Timer } from './components/Timer/Timer'
import { useReviewSession } from './contexts/reviewSession/reviewSessionContext'

const App: FC = () => {
  const { correctCount, incorrectCount } = useReviewSession()
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />
      <Toolbar />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 64px)"
        flexDirection={'column'}
      >
        <Box>
          <Typography>correct: {correctCount}</Typography>
          <Typography>incorrect: {incorrectCount}</Typography>
          <Typography>
            totalAccuracy:{' '}
            {incorrectCount > 0
              ? Math.ceil(
                  (correctCount / (correctCount + incorrectCount)) * 100
                )
              : 100}
          </Typography>
        </Box>
        <TimerContextProvider>
          <Timer />
          <MultiplicationCard />
        </TimerContextProvider>
      </Box>
    </Box>
  )
}

export default App
