import { AppBar, Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import { Login } from '../Login/Login'

export const Header = () => {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar position="fixed" color="transparent" elevation={0}>
      <Toolbar>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <Login compact={compact} />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
