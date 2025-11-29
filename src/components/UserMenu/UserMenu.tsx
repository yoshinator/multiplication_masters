import { useState } from 'react'
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { useUser } from '../../contexts/user/useUserContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'

const UserMenu = () => {
  const { user } = useUser()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()

  const open = Boolean(anchorEl)
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const firstLetter = user?.username?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 600 }}>{user?.username}</Typography>

        <IconButton onClick={handleOpen} size="small">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontWeight: 700,
            }}
          >
            {firstLetter}
          </Avatar>
        </IconButton>
      </Box>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleClose()
            navigate(ROUTES.PROFILE)
          }}
        >
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose()
            navigate(ROUTES.BUILDER)
          }}
        >
          My World
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose()
            navigate(ROUTES.TRAIN)
          }}
        >
          Train
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={handleClose}>
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserMenu
