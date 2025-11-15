import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { FirebaseProvider } from './contexts/firebase/FirebaseProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>
)
