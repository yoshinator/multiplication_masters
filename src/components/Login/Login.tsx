import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
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
      sx={{ display: 'flex', gap: 1 }}
    >
      <TextField
        size="small"
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? '...' : 'Start'}
      </Button>

      {error && <Box sx={{ color: 'error.main' }}>{error}</Box>}
    </Box>
  )
}

export default Login
