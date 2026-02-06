import { useMemo, useState, type FC } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useAuthActions } from '../../hooks/useAuthActions'

type UsernamePinLoginProps = {
  onSuccess: () => void
}

const UsernamePinLogin: FC<UsernamePinLoginProps> = ({ onSuccess }) => {
  const { loginWithUsernamePin } = useAuthActions()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const usernameOk = useMemo(() => {
    const u = username.trim()
    return /^[a-zA-Z0-9_]{3,20}$/.test(u)
  }, [username])

  const pinOk = useMemo(() => /^\d{6}$/.test(pin), [pin])

  const canSubmit = usernameOk && pinOk && !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      await loginWithUsernamePin(username.trim(), pin)
      onSuccess()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Username + PIN
      </Typography>

      <Stack spacing={1.5}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={Boolean(username) && !usernameOk}
          helperText={
            username ? '3-20 characters: letters, numbers, underscores' : ' '
          }
          fullWidth
        />

        <TextField
          label="6-digit PIN"
          type="password"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputProps={{ inputMode: 'numeric' }}
          error={Boolean(pin) && !pinOk}
          helperText={pin ? 'Enter your 6-digit PIN' : ' '}
          fullWidth
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </Stack>
    </Box>
  )
}

export default UsernamePinLogin
