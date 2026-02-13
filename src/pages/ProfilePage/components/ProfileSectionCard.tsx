import { Box, type SxProps, type Theme } from '@mui/material'
import type { FC, ReactNode } from 'react'

type ProfileSectionCardProps = {
  children: ReactNode
  sx?: SxProps<Theme>
}

const ProfileSectionCard: FC<ProfileSectionCardProps> = ({ children, sx }) => {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export default ProfileSectionCard
