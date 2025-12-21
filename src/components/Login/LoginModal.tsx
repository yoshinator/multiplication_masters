import type { FC } from 'react'
import AppModal from '../AppModal/AppModal'
import Login from '../Login/Login'

type LoginModalProps = {
  open: boolean
  onClose: () => void
}

const LoginModal: FC<LoginModalProps> = ({ open, onClose }) => {
  return (
    <AppModal open={open} onClose={onClose} title="Sign In">
      <Login onSuccess={onClose} />
    </AppModal>
  )
}

export default LoginModal
