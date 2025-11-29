import { type FC } from 'react'
import { Box, Toolbar } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Header from './components/Header/Header'
import { useUser } from './contexts/user/useUserContext'

// Pages (you will create these shortly)
import AppContent from './components/AppContent/AppContent'
import SceneBuilderPage from './pages/SceneBuilderPage/SceneBuilderPage'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import PracticePage from './pages/PracticePage/PracticePage'
import HomePage from './pages/HomePage/HomePage'
import { ROUTES } from './constants/routeConstants'

const App: FC = () => {
  const { user } = useUser()

  return (
    <BrowserRouter>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header />
        <Toolbar />

        <Routes>
          {/* Public route — before login */}
          <Route path={ROUTES.HOME} element={<HomePage />} />

          {/* Only show app content if user is logged in */}
          {user ? (
            <>
              {/* Your main practice / session logic */}
              <Route path={ROUTES.TRAIN} element={<AppContent />} />

              {/* Scene Builder */}
              <Route path={ROUTES.BUILDER} element={<SceneBuilderPage />} />

              {/* Profile */}
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

              {/* Practice modes */}
              <Route path={ROUTES.PRACTICE} element={<PracticePage />} />

              {/* Catch-all → redirect to /app */}
              <Route path="*" element={<Navigate to="/train" replace />} />
            </>
          ) : (
            // If user is not logged in → redirect to home
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          )}
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App
