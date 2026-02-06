import { useState, type FC } from 'react'
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Checkbox,
  FormControlLabel,
  Link,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import AppModal from '../AppModal/AppModal'
import { useSaveProgress } from '../../hooks/useSaveProgress'
import { Link as RouterLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'

type SaveProgressModalProps = {
  onClose: () => void
}

const SaveProgressModal: FC<SaveProgressModalProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'menu' | 'email'>('menu')
  const [email, setEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsError, setShowTermsError] = useState(false)

  const { handleSnooze, handleGoogleLink, handleEmailLink } = useSaveProgress()

  const ensureTermsAccepted = () => {
    if (acceptedTerms) return true
    setShowTermsError(true)
    return false
  }

  const handleSendLink = () => {
    if (!email.trim()) return
    if (!ensureTermsAccepted()) return
    handleEmailLink(email)
    onClose()
  }

  const handleGoogleContinue = async () => {
    if (!ensureTermsAccepted()) return
    await handleGoogleLink()
    onClose()
  }

  return (
    <AppModal open onClose={onClose} title="Save your progress?" maxWidth="xs">
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Create an account to keep streaks, levels, and unlocks across devices.
        </Typography>
      </Box>

      <Stack spacing={2} sx={{ mb: 2 }}>
        {mode === 'menu' ? (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleContinue}
              fullWidth
            >
              Continue with Google
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setMode('email')}
              fullWidth
            >
              Email me a link
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button
              variant="contained"
              onClick={handleSendLink}
              disabled={!email.trim()}
              fullWidth
            >
              Send Link
            </Button>
            <Button
              onClick={() => {
                setEmail('')
                setMode('menu')
                setShowTermsError(false)
              }}
              fullWidth
            >
              Back
            </Button>
          </>
        )}
      </Stack>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked)
                if (e.target.checked) setShowTermsError(false)
              }}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I agree to the{' '}
              <Link component={RouterLink} to={ROUTES.TERMS} target="_blank">
                Terms of Service
              </Link>
              .
            </Typography>
          }
        />
        {showTermsError ? (
          <Typography variant="caption" color="error" sx={{ display: 'block' }}>
            Please accept the Terms of Service to continue.
          </Typography>
        ) : null}
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          onClick={() => {
            setEmail('')
            setMode('menu')
            setAcceptedTerms(false)
            setShowTermsError(false)
            onClose()
          }}
          color="inherit"
          sx={{ color: 'text.secondary' }}
        >
          Not now
        </Button>
        <Button
          onClick={() => {
            setEmail('')
            setMode('menu')
            setAcceptedTerms(false)
            setShowTermsError(false)
            handleSnooze()
            onClose()
          }}
          color="inherit"
          sx={{ color: 'text.secondary' }}
        >
          Remind me later
        </Button>
      </Stack>
    </AppModal>
  )
}

export default SaveProgressModal
