import { useState, useRef } from 'react'
import {
  Avatar,
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from '@mui/material'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useAuthActions } from '../../hooks/useAuthActions'
import { capitalizeFirstLetter } from '../../utilities/stringHelpers'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import SaveProgressModal from '../Login/SaveProgressModal'
import { useModal } from '../../contexts/modalContext/modalContext'
import { useIsMobile } from '../../hooks/useIsMobile'

export const UserMenu = () => {
  const { profile } = useUser()
  const { auth } = useFirebaseContext()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { openModal, closeModal } = useModal()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const avatarRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const open = Boolean(anchorEl)
  const handleOpen = () => setAnchorEl(avatarRef.current)
  const handleClose = () => setAnchorEl(null)

  const firstLetter = profile?.displayName?.charAt(0)?.toUpperCase() ?? '?'
  const isAnonymous = auth?.currentUser?.isAnonymous

  return (
    <span>
      <Button
        onClick={handleOpen}
        color="inherit"
        sx={{ textTransform: 'none', gap: 1 }}
      >
        <Typography
          sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
        >
          {capitalizeFirstLetter(profile?.displayName ?? 'anonymous user')}
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
        {isAnonymous && (
          <MenuItem
            onClick={() => {
              handleClose()
              openModal(<SaveProgressModal onClose={closeModal} />)
            }}
            sx={{ color: 'warning.main', fontWeight: 'bold' }}
          >
            Save Progress
          </MenuItem>
        )}
        {isAnonymous && <Divider />}
        <MenuItem
          onClick={() => {
            handleClose()
            navigate(ROUTES.PROFILE)
          }}
        >
          Profile
        </MenuItem>
        {isMobile
          ? [
              <MenuItem
                key={ROUTES.STATS}
                onClick={() => {
                  handleClose()
                  navigate(ROUTES.STATS)
                }}
              >
                My Stats
              </MenuItem>,
              <MenuItem
                key={ROUTES.TRAIN}
                onClick={() => {
                  handleClose()
                  navigate(ROUTES.TRAIN)
                }}
              >
                Train
              </MenuItem>,
              <MenuItem
                key={ROUTES.BUILDER}
                onClick={() => {
                  handleClose()
                  navigate(ROUTES.BUILDER)
                }}
              >
                Build
              </MenuItem>,
            ]
          : null}
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
    </span>
  )
}

export const UserMenuSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Skeleton
        variant="text"
        width={100}
        sx={{ display: { xs: 'none', sm: 'block' } }}
      />
      <Skeleton variant="circular" width={36} height={36} />
    </Box>
  )
}
