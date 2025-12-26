import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useAuthActions } from '../../hooks/useAuthActions'

type LoginProps = {
  onSuccess?: () => void
}

const Login: FC<LoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { loginWithUsername } = useAuthActions()

  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const name = username.trim()
    if (!name) return

    try {
      setLoading(true)
      setError(null)

      await loginWithUsername(name)

      navigate(ROUTES.TRAIN, { replace: true })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}
    >
      <Typography variant="body1" color="text.secondary">
        Enter your username to continue your progress.
      </Typography>

      <TextField
        label="Username"
        placeholder="e.g. MathWizard"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        autoFocus
        required
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircle color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
      >
        {loading ? 'Signing in...' : 'Start Learning'}
      </Button>
    </Box>
  )
}

export default Login
