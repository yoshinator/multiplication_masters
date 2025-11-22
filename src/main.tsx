import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { FirebaseProvider } from './contexts/firebase/FirebaseProvider.tsx'
import { UserProvider } from './contexts/user/userProvider.tsx'
import { ReviewSessionProvider } from './contexts/reviewSession/ReviewSessionProvider.tsx'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme/theme.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <UserProvider>
        <ReviewSessionProvider>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </ReviewSessionProvider>
      </UserProvider>
    </FirebaseProvider>
  </StrictMode>
)
