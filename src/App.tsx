import { type FC } from 'react'
import { Box, Toolbar } from '@mui/material'
import Header from './components/Header/Header'
import AppContent from './components/AppContent/AppContent'
import { useUser } from './contexts/user/useUserContext'

const App: FC = () => {
  const { user } = useUser()
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      <Toolbar />

      {user && <AppContent />}
    </Box>
  )
}

export default App
