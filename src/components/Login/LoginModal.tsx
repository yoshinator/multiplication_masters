import type { FC } from 'react'
import { Button, Divider, Box } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import AppModal from '../AppModal/AppModal'
import Login from '../Login/Login'
import ProfilePinLogin from './ProfilePinLogin'
import { useAuthActions } from '../../hooks/useAuthActions'
import { useNotification } from '../../contexts/notificationContext/notificationContext'

type LoginModalProps = {
  onClose: () => void
}

const LoginModal: FC<LoginModalProps> = ({ onClose }) => {
  const { loginWithGoogle } = useAuthActions()
  const { showNotification } = useNotification()

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      onClose()
    } catch {
      showNotification('Google sign-in failed. Please try again.', 'error')
    }
    onClose()
  }

  return (
    <AppModal open onClose={onClose} title="Sign In" maxWidth="xs">
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          fullWidth
        >
          Sign in with Google
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }}>OR</Divider>
      <Login
        onSuccess={() => {
          onClose()
          showNotification(
            'Click on the link in your email to sign in',
            'success'
          )
        }}
      />

      <Divider sx={{ my: 2 }}>OR</Divider>
      <ProfilePinLogin onSuccess={onClose} />
    </AppModal>
  )
}

export default LoginModal
