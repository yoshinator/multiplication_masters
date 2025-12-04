import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import FirebaseProvider from './contexts/firebase/FirebaseProvider.tsx'
import UserProvider from './contexts/user/UserProvider.tsx'
import ReviewSessionProvider from './contexts/reviewSession/ReviewSessionProvider.tsx'
import CardSchedulerProvider from './contexts/cardScheduler/CardSchedulerProvider.tsx'
import SessionStatusProvider from './contexts/SessionStatusContext/SessionStatusProvider.tsx'

import { ThemeProvider } from '@mui/material'
import { theme } from './theme/theme.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <UserProvider>
        <SessionStatusProvider>
          <ReviewSessionProvider>
            <CardSchedulerProvider>
              <ThemeProvider theme={theme}>
                <App />
              </ThemeProvider>
            </CardSchedulerProvider>
          </ReviewSessionProvider>
        </SessionStatusProvider>
      </UserProvider>
    </FirebaseProvider>
  </StrictMode>
)
