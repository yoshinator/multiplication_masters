import { useState, type FC } from 'react'
import { Box, Button, Typography, Stack, TextField } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import AppModal from '../AppModal/AppModal'

type SaveProgressModalProps = {
  open: boolean
  onClose: () => void
  onSnooze: () => void
  onGoogle: () => void
  onSendEmailLink: (email: string) => void
}

const SaveProgressModal: FC<SaveProgressModalProps> = ({
  open,
  onClose,
  onSnooze,
  onGoogle,
  onSendEmailLink,
}) => {
  const [isEmailMode, setIsEmailMode] = useState(false)
  const [email, setEmail] = useState('')

  const handleSendLink = () => {
    onSendEmailLink(email)
    onClose()
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Save your progress?"
      maxWidth="xs"
    >
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
              onClick={onGoogle}
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
            <Button variant="contained" onClick={handleSendLink} fullWidth>
              Send Link
            </Button>
            <Button onClick={() => setIsEmailMode(false)} fullWidth>
              Back
            </Button>
          </>
        )}
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ color: 'text.secondary' }}
        >
          Not now
        </Button>
        <Button
          onClick={onSnooze}
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
