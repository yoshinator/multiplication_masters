import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { FirebaseProvider } from './contexts/firebase/FirebaseProvider.tsx'
import { UserProvider } from './contexts/user/userProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </FirebaseProvider>
  </StrictMode>
)
