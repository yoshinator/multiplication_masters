import type { FC, ReactNode } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { Navigate } from 'react-router-dom'
import { useUser } from '../../contexts/userContext/useUserContext'
import { ROUTES } from '../../constants/routeConstants'

interface Props {
  children: ReactNode
}

const RequireTeacher: FC<Props> = ({ children }) => {
  const { authStatus, user, isProfileSession } = useUser()

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

  if (isProfileSession || user.userRole !== 'teacher') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, px: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Teachers only
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This area is available to teacher accounts.
          </Typography>
        </Box>
      </Box>
    )
  }

  return children
}

export default RequireTeacher
