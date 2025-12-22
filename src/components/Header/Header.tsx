import { AppBar, Toolbar, Typography, Button } from '@mui/material'
import { useState } from 'react'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import Login from '../Login/Login'
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
          backgroundColor: 'rgba(255,255,255,0.8)',
        }}
      >
        <Toolbar sx={{ minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 800, flexGrow: 1 }}>
            Math Builders
          </Typography>

          {!user ? (
            isMobile ? (
              <Button size="small" onClick={() => setLoginOpen(true)}>
                Login
              </Button>
            ) : (
              <Login />
            )
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
