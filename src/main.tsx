import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { FirebaseProvider } from './contexts/firebase/FirebaseProvider.tsx'
import { UserProvider } from './contexts/user/userProvider.tsx'
import { ReviewSessionProvider } from './contexts/reviewSession/ReviewSessionProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <UserProvider>
        <ReviewSessionProvider>
          <App />
        </ReviewSessionProvider>
      </UserProvider>
    </FirebaseProvider>
  </StrictMode>
)
