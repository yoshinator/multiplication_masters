import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import LoginModal from '../Login/LoginModal'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useAuthActions } from '../../hooks/useAuthActions'
import { useIsMobile } from '../../hooks/useIsMobile'
import { UserMenu, UserMenuSkeleton } from '../UserMenu/UserMenu'
import { useLocation, useNavigate, matchPath } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useModal } from '../../contexts/modalContext/modalContext'

const Header = () => {
  const { user, isLoading } = useUser()
  const isMobile = useIsMobile()
  const { openModal, closeModal } = useModal()
  const { loginAnonymously } = useAuthActions()
  const navigate = useNavigate()
  const location = useLocation()

  const isPublicInfoRoute =
    location.pathname === ROUTES.LEARN_MORE ||
    location.pathname === ROUTES.PRIVACY ||
    location.pathname === ROUTES.TERMS ||
    location.pathname === ROUTES.COPPA ||
    location.pathname === ROUTES.FERPA

  const navItems = user
    ? [
        { label: 'Train', path: ROUTES.TRAIN },
        { label: 'Stats', path: ROUTES.STATS },
        { label: 'Builder', path: ROUTES.BUILDER },
        { label: 'Profile', path: ROUTES.PROFILE },
      ]
    : isPublicInfoRoute
      ? [{ label: 'Home', path: ROUTES.HOME }]
      : [{ label: 'Learn More', path: ROUTES.LEARN_MORE }]

  const isActive = (path: string) =>
    matchPath({ path, end: true }, location.pathname) != null

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

          {!isMobile && navItems.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 1.5, mr: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  color={isActive(item.path) ? 'primary' : 'inherit'}
                  onClick={() => navigate(item.path)}
                  sx={{ fontWeight: 700 }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          ) : null}

          {isLoading ? (
            <UserMenuSkeleton />
          ) : !user ? (
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
                onClick={() => openModal(<LoginModal onClose={closeModal} />)}
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
