import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import FirebaseProvider from './contexts/firebase/FirebaseProvider.tsx'
import UserProvider from './contexts/userContext/UserProvider.tsx'
import ReviewSessionProvider from './contexts/reviewSession/ReviewSessionProvider.tsx'
import CardSchedulerProvider from './contexts/cardScheduler/CardSchedulerProvider.tsx'
import SessionStatusProvider from './contexts/SessionStatusContext/SessionStatusProvider.tsx'
import ModalProvider from './contexts/modalContext/ModalProvider.tsx'

import { ThemeContextProvider } from './contexts/themeContext/ThemeContextProvider.tsx'
import { NotificationProvider } from './contexts/notificationContext/NotificationProvider.tsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <FirebaseProvider>
        <ThemeContextProvider>
          <NotificationProvider>
            <UserProvider>
              <ModalProvider>
                <SessionStatusProvider>
                  <ReviewSessionProvider>
                    <CardSchedulerProvider>
                      <App />
                    </CardSchedulerProvider>
                  </ReviewSessionProvider>
                </SessionStatusProvider>
              </ModalProvider>
            </UserProvider>
          </NotificationProvider>
        </ThemeContextProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </StrictMode>
)
