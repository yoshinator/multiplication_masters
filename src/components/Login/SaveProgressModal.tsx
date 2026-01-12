import { useState, type FC } from 'react'
import { Box, Button, Typography, Stack, TextField } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import AppModal from '../AppModal/AppModal'
import { useSaveProgress } from '../../hooks/useSaveProgress'

type SaveProgressModalProps = {
  onClose: () => void
}

const SaveProgressModal: FC<SaveProgressModalProps> = ({ onClose }) => {
  const [isEmailMode, setIsEmailMode] = useState(false)
  const [email, setEmail] = useState('')

  const { handleSnooze, handleGoogleLink, handleEmailLink } = useSaveProgress()

  const handleSendLink = () => {
    if (!email.trim()) return
    handleEmailLink(email)
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
        {!isEmailMode ? (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLink}
              fullWidth
            >
              Continue with Google
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIsEmailMode(true)}
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
                setIsEmailMode(false)
              }}
              fullWidth
            >
              Back
            </Button>
          </>
        )}
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          onClick={() => {
            setEmail('')
            setIsEmailMode(false)
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
            setIsEmailMode(false)
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
