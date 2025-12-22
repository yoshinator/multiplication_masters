import type { FC, ReactNode } from 'react'
import { useUser } from '../../contexts/userContext/useUserContext'
import { CircularProgress, Box } from '@mui/material'

interface Props {
  children: ReactNode
}

const RequireUser: FC<Props> = ({ children }) => {
  const { user } = useUser()

  if (user === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return children
}

export default RequireUser
