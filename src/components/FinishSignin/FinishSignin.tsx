import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material'
import { useAuthActions } from '../../hooks/useAuthActions'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { extractErrorMessage } from '../../utilities/typeutils'

const FinishSignin = () => {
  const { auth } = useFirebaseContext()
  const { isEmailLink, finishEmailSignIn } = useAuthActions()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [promptForEmail, setPromptForEmail] = useState(false)
  const processedRef = useRef(false)
  const { showNotification } = useNotification()

  useEffect(() => {
    if (!auth) return

    // Use the Firebase onAuthStateChanged to ensure the SDK has
    // attempted to restore the previous (anonymous) session.
    const unsubscribe = auth.onAuthStateChanged(async () => {
      if (processedRef.current) return

      if (isEmailLink(window.location.href)) {
        const savedEmail = window.localStorage.getItem('emailForSignIn')

        if (savedEmail) {
          processedRef.current = true
          try {
            // Now 'user' (auth.currentUser) should be populated
            // if the anonymous session survived the redirect.
            await finishEmailSignIn(savedEmail, window.location.href)
            window.localStorage.removeItem('emailForSignIn')
            navigate('/')
          } catch (error) {
            setLoading(false)
            showNotification(extractErrorMessage(error), 'error')
          }
        } else {
          setPromptForEmail(true)
          setLoading(true)
        }
      }
    })

    return () => unsubscribe()
  }, [auth, navigate, isEmailLink, finishEmailSignIn, showNotification])

  const handleManualSubmit = async () => {
    if (!email) return
    setLoading(true)
    try {
      await finishEmailSignIn(email, window.location.href)
      navigate('/')
    } catch {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (promptForEmail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, p: 2 }}>
        <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }} elevation={3}>
          <Typography variant="h5" gutterBottom align="center">
            Confirm your email
          </Typography>
          <Typography
            variant="body2"
            sx={{ mb: 3, color: 'text.secondary' }}
            align="center"
          >
            Please enter your email address to complete the sign-in process.
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
            autoFocus
          />
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleManualSubmit}
            disabled={!email}
          >
            Complete Sign In
          </Button>
        </Paper>
      </Box>
    )
  }

  return null
}

export default FinishSignin
