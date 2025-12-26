import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import LoginModal from '../Login/LoginModal'
import UserMenu from '../UserMenu/UserMenu'

const Header = () => {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const [loginOpen, setLoginOpen] = useState(false)

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
            component="img"
            src="/mathbuilders.png"
            alt="Math Builders"
            sx={{ height: 50, mr: 1 }}
          />
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 800,
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box component="span" sx={{ color: 'text.primary' }}>
              Math
            </Box>
            <Box component="span" sx={{ color: 'primary.main' }}>
              Builders
            </Box>
          </Typography>

          {!user ? (
            <Button
              size={isMobile ? 'small' : 'medium'}
              onClick={() => setLoginOpen(true)}
            >
              Login
            </Button>
          ) : (
            <UserMenu />
          )}
        </Toolbar>
      </AppBar>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

export default Header
