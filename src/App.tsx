import type { FC } from 'react'
import { Box, Toolbar } from '@mui/material'

import { MultiplicationCard } from './components/MultiplicationCard/MultiplicationCard'
import Header from './components/Header/Header'
import { TimerContextProvider } from './contexts/timer/TimerProvider'
import { Timer } from './components/Timer/Timer'

const App: FC = () => {
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
        <TimerContextProvider>
          <Timer />
          <MultiplicationCard />
        </TimerContextProvider>
      </Box>
    </Box>
  )
}

export default App
