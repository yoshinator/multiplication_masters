import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useAuthActions } from '../../hooks/useAuthActions'

type LoginProps = {
  onSuccess?: () => void
}

const Login: FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { loginWithEmail } = useAuthActions()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      await loginWithEmail(email, password)

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
        'Sign in to your account.'
      </Typography>

      <>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          autoFocus
          required
          error={!!error}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          error={!!error}
          helperText={error}
        />
      </>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
      >
        {loading ? 'Please wait...' : 'Sign In'}
      </Button>
    </Box>
  )
}

export default Login
