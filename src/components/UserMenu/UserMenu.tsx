import { useState, useRef } from 'react'
import { Avatar, Button, Menu, MenuItem, Typography } from '@mui/material'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useAuthActions } from '../../hooks/useAuthActions'
import { capitalizeFirstLetter } from '../../utilities/stringHelpers'

const UserMenu = () => {
  const { user } = useUser()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const avatarRef = useRef<HTMLDivElement>(null)

  const open = Boolean(anchorEl)
  const handleOpen = () => setAnchorEl(avatarRef.current)
  const handleClose = () => setAnchorEl(null)

  const firstLetter = user?.username?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <>
      <Button
        onClick={handleOpen}
        color="inherit"
        sx={{ textTransform: 'none', gap: 1 }}
      >
        <Typography
          sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
        >
          {capitalizeFirstLetter(user?.username ?? 'anonymous user')}
        </Typography>

        <Avatar
          ref={avatarRef}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontWeight: 700,
          }}
        >
          {firstLetter}
        </Avatar>
      </Button>

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
            navigate(ROUTES.STATS)
          }}
        >
          My Stats
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose()
            navigate(ROUTES.TRAIN)
          }}
        >
          Train
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={async () => {
            handleClose()
            await signOut()
            navigate('/')
          }}
        >
          Sign Out
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserMenu
