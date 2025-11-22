import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { useUser } from '../../contexts/user/useUserContext'
import Login from '../Login/Login'
import UserMenu from '../UserMenu/UserMenu'

const Header = () => {
  const { user } = useUser()

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(255,255,255,0.8)',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Multiplication Masters
        </Typography>

        <Box sx={{ flexShrink: 0 }}>{!user ? <Login /> : <UserMenu />}</Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
