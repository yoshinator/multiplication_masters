import { type FC } from 'react'
import { Box, Toolbar } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ROUTES } from './constants/routeConstants'

import HomePage from './pages/HomePage/HomePage'
import PracticePage from './pages/PracticePage/PracticePage'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import SceneBuilderPage from './pages/SceneBuilderPage/SceneBuilderPage'
import StatsPage from './pages/StatsPage/StatsPage'
import Header from './components/Header/Header'
import RequireUser from './components/RequireUser/RequireUser'

const App: FC = () => {
  return (
    <BrowserRouter>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100dvh - 64px)',
        }}
      >
        <Header />
        <Toolbar />

        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />

          <Route
            path={ROUTES.TRAIN}
            element={
              <RequireUser>
                <PracticePage />
              </RequireUser>
            }
          />

          <Route
            path={ROUTES.STATS}
            element={
              <RequireUser>
                <StatsPage />
              </RequireUser>
            }
          />

          <Route
            path={ROUTES.PROFILE}
            element={
              <RequireUser>
                <ProfilePage />
              </RequireUser>
            }
          />

          <Route
            path={ROUTES.BUILDER}
            element={
              <RequireUser>
                <SceneBuilderPage />
              </RequireUser>
            }
          />

          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App
