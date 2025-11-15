import type { FC } from 'react'
import { useState } from 'react'
import { Box, Button, Input } from '@mui/material'
import { useLogin } from './useLogin'

type LoginProps = {
  compact?: boolean
}

export const Login: FC<LoginProps> = ({ compact = false }) => {
  const [username, setUsername] = useState<string>('')
  const { login, cards, loading, error } = useLogin()

  const handleSubmit = async () => {
    const name = username.trim()
    if (!name) {
      // TODO: replace this later
      alert('Need  a username')
    }

    await login(name)
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {!compact && (
        <Input
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      )}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
        data-cards-count={cards.length}
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
