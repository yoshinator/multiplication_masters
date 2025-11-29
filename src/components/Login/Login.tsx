import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'
import { useLogin } from './useLogin'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'

const Login: FC = () => {
  const [username, setUsername] = useState('')
  const { login, loading, error } = useLogin()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = username.trim()
    if (!name) return
    await login(name)
    navigate(ROUTES.TRAIN)
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
    >
      <TextField
        size="small"
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        sx={{ minWidth: 120 }}
      />

      <Button
        variant="contained"
        disabled={loading}
        type="submit"
        sx={{ px: 3 }}
      >
        {loading ? '...' : 'Login'}
      </Button>

      {error && (
        <Box component="span" sx={{ color: 'error.main', ml: 1 }}>
          {error}
        </Box>
      )}
    </Box>
  )
}

export default Login
