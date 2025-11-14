import type { FC } from 'react'
import { Box, Toolbar } from '@mui/material'

import { MultiplicationCard } from './components/MultiplicationCard'
import Header from './components/Header'

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
      >
        <MultiplicationCard />
      </Box>
    </Box>
  )
}

export default App
