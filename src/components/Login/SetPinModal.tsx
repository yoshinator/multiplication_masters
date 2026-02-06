import { useMemo, useState, type FC } from 'react'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import AppModal from '../AppModal/AppModal'
import { useAuthActions } from '../../hooks/useAuthActions'
import { useUser } from '../../contexts/userContext/useUserContext'

type SetPinModalProps = {
  onClose: () => void
}

const SetPinModal: FC<SetPinModalProps> = ({ onClose }) => {
  const { user } = useUser()
  const { setUsernamePin } = useAuthActions()

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pinOk = useMemo(() => /^\d{6}$/.test(pin), [pin])
  const confirmOk = useMemo(() => {
    return confirmPin === pin && confirmPin.length > 0
  }, [confirmPin, pin])

  const canSubmit = pinOk && confirmOk && !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      await setUsernamePin(pin)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppModal open onClose={onClose} title="Set a sign-in PIN" maxWidth="xs">
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Your sign-in username is:
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {user?.username ?? ''}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        PIN sign-in can only be enabled once. Keep it private.
      </Alert>

      <Stack spacing={1.5}>
        <TextField
          label="6-digit PIN"
          type="password"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputProps={{ inputMode: 'numeric' }}
          error={Boolean(pin) && !pinOk}
          helperText={pin ? 'Enter a 6-digit PIN' : ' '}
          fullWidth
          autoFocus
        />

        <TextField
          label="Confirm PIN"
          type="password"
          value={confirmPin}
          onChange={(e) =>
            setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputProps={{ inputMode: 'numeric' }}
          error={Boolean(confirmPin) && !confirmOk}
          helperText={confirmPin ? 'Re-enter your PIN' : ' '}
          fullWidth
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Saving...' : 'Enable PIN sign-in'}
        </Button>

        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </Stack>
    </AppModal>
  )
}

export default SetPinModal
