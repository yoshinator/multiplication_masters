import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useAuthActions } from '../../hooks/useAuthActions'
import { useIsMobile } from '../../hooks/useIsMobile'
import LoginModal from '../Login/LoginModal'
import UserMenu from '../UserMenu/UserMenu'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useModal } from '../../contexts/modalContext/modalContext'

const Header = () => {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const { openModal, closeModal } = useModal()
  const { loginAnonymously } = useAuthActions()
  const navigate = useNavigate()

  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{
          backdropFilter: 'blur(6px)',
          backgroundColor: (theme) =>
            alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <Toolbar sx={{ minWidth: 0 }}>
          <Box
            id="header-logo"
            onClick={() =>
              user ? navigate(ROUTES.TRAIN) : navigate(ROUTES.HOME)
            }
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Box
              component="img"
              src="/mathbuilders.png"
              alt="Math Builders"
              sx={{ height: 50, mr: 1 }}
            />

            <Typography variant="h6" noWrap sx={{ fontWeight: 800 }}>
              <Box component="span" sx={{ color: 'text.primary' }}>
                Math
              </Box>
              <Box component="span" sx={{ color: 'primary.main' }}>
                Builders
              </Box>
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {!user ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size={isMobile ? 'small' : 'medium'}
                onClick={loginAnonymously}
              >
                Try
              </Button>
              <Button
                size={isMobile ? 'small' : 'medium'}
                onClick={() =>
                  openModal(<LoginModal open={true} onClose={closeModal} />)
                }
              >
                Login
              </Button>
            </Box>
          ) : (
            <Box id="header-user-menu">
              <UserMenu />
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  )
}

export default Header
