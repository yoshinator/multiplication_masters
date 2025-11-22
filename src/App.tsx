import type { FC } from 'react'
import { Box, Toolbar } from '@mui/material'

import MultiplicationCard from './components/MultiplicationCard/MultiplicationCard'
import StatsPanel from './components/StatsPanel/StatsPanel'
import Header from './components/Header/Header'
import { TimerContextProvider } from './contexts/timer/TimerProvider'
import { Timer } from './components/Timer/Timer'

const App: FC = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />
      <Toolbar />
      <StatsPanel />
      <TimerContextProvider>
        <Timer />
        <MultiplicationCard />
      </TimerContextProvider>
    </Box>
  )
}

export default App
