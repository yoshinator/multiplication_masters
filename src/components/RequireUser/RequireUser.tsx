import type { FC, ReactNode } from 'react'
import { CircularProgress, Box } from '@mui/material'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useUser } from '../../contexts/userContext/useUserContext'

interface Props {
  children: ReactNode
}

const RequireUser: FC<Props> = ({ children }) => {
  const { user, authStatus } = useUser()

  if (authStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (authStatus === 'signedOut' || !user) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return children
}

export default RequireUser
