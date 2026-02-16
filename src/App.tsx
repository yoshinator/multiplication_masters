import { type FC, useEffect } from 'react'
import { Box, Toolbar } from '@mui/material'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { ROUTES } from './constants/routeConstants'

import ProfilePage from './pages/ProfilePage/ProfilePage'
import PracticePage from './pages/PracticePage/PracticePage'
import HomePage from './pages/HomePage/HomePage'
import Header from './components/Header/Header'
import RequireUser from './components/RequireUser/RequireUser'
import StatsPage from './pages/StatsPage/StatsPage'
import TimerContextProvider from './contexts/timerContext/TimerProvider'
import FinishSignin from './components/FinishSignin/FinishSignin'
import FeedbackButton from './components/FeedbackButton/FeedbackButton'
import SceneBuilderPage from './pages/SceneBuilderPage/SceneBuilderPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage/PrivacyPolicyPage'
import CoppaPage from './pages/CoppaPage/CoppaPage'
import FerpaPage from './pages/FerpaPage/FerpaPage'
import TermsOfServicePage from './pages/TermsOfServicePage/TermsOfServicePage'
import LearnMorePage from './pages/LearnMorePage/LearnMorePage'
import Footer from './components/Footer/Footer'
import { useUser } from './contexts/userContext/useUserContext'
import { useAuthActions } from './hooks/useAuthActions'
import { useInactivityLogout } from './hooks/useInactivityLogout'
import { useNotification } from './contexts/notificationContext/notificationContext'
import { isPublicInfoPath } from './constants/publicInfoRoutes'

const App: FC = () => {
  const location = useLocation()
  const { user, authStatus } = useUser()
  const { signOut } = useAuthActions()
  const { showNotification } = useNotification()

  const shouldShowFooter = isPublicInfoPath(location.pathname, {
    includeHome: true,
  })

  const isProfilePinSession =
    authStatus === 'signedIn' && user?.lastSignInMethod === 'profilePin'

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  useInactivityLogout({
    enabled: Boolean(isProfilePinSession),
    // Ten minutes. Young learners might try login in on shared devices.
    timeoutMs: 10 * 60 * 1000,
    onTimeout: async () => {
      await signOut()
      showNotification('Signed out due to inactivity.', 'info')
    },
  })

  return (
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
        <Route path={ROUTES.LEARN_MORE} element={<LearnMorePage />} />

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
        <Route
          path={ROUTES.BUILDER}
          element={
            <RequireUser>
              <SceneBuilderPage />
            </RequireUser>
          }
        />

        <Route path={ROUTES.SIGNIN} element={<FinishSignin />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
        <Route path={ROUTES.COPPA} element={<CoppaPage />} />
        <Route path={ROUTES.FERPA} element={<FerpaPage />} />
        <Route path={ROUTES.TERMS} element={<TermsOfServicePage />} />

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
      <FeedbackButton />
      {shouldShowFooter ? <Footer /> : null}
    </Box>
  )
}

export default App
