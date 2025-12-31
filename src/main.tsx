import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import FirebaseProvider from './contexts/firebase/FirebaseProvider.tsx'
import UserProvider from './contexts/userContext/UserProvider.tsx'
import ReviewSessionProvider from './contexts/reviewSession/ReviewSessionProvider.tsx'
import CardSchedulerProvider from './contexts/cardScheduler/CardSchedulerProvider.tsx'
import SessionStatusProvider from './contexts/SessionStatusContext/SessionStatusProvider.tsx'

import { ThemeContextProvider } from './contexts/themeContext/ThemeContextProvider.tsx'
import { NotificationProvider } from './contexts/notificationContext/NotificationProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <NotificationProvider>
        <UserProvider>
          <SessionStatusProvider>
            <ReviewSessionProvider>
              <CardSchedulerProvider>
                <ThemeContextProvider>
                  <App />
                </ThemeContextProvider>
              </CardSchedulerProvider>
            </ReviewSessionProvider>
          </SessionStatusProvider>
        </UserProvider>
      </NotificationProvider>
    </FirebaseProvider>
  </StrictMode>
)
