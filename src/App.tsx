import { type FC } from 'react'
import { Box, Toolbar } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ROUTES } from './constants/routeConstants'

import ProfilePage from './pages/ProfilePage/ProfilePage'
import PracticePage from './pages/PracticePage/PracticePage'
import HomePage from './pages/HomePage/HomePage'
import Header from './components/Header/Header'
import RequireUser from './components/RequireUser/RequireUser'
import StatsPage from './pages/StatsPage/StatsPage'
import TimerContextProvider from './contexts/timerContext/TimerProvider'
import FinishSignin from './components/FinishSignin/FinishSignin'

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
                <TimerContextProvider>
                  <PracticePage />
                </TimerContextProvider>
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

          <Route path={ROUTES.SIGNIN} element={<FinishSignin />} />

          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App
