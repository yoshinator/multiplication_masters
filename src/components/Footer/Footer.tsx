import { Box, Container, Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'

const Footer = () => {
  const shortSha =
    __APP_GIT_SHA__ === 'dev' ? 'dev' : __APP_GIT_SHA__.slice(0, 7)
  const versionLabel = `v${__APP_VERSION__} (${shortSha})`

  return (
    <Box
      component="footer"
      sx={{
        pt: 3,
        pb: { xs: 10, sm: 3 },
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}{' '}
          <Link color="inherit" component={RouterLink} to={ROUTES.HOME}>
            Multiplication Masters
          </Link>{' '}
          |{' '}
          <Link component={RouterLink} to={ROUTES.PRIVACY} color="inherit">
            Privacy Policy
          </Link>{' '}
          |{' '}
          <Link component={RouterLink} to={ROUTES.TERMS} color="inherit">
            Terms of Service
          </Link>{' '}
          |{' '}
          <Link component={RouterLink} to={ROUTES.COPPA} color="inherit">
            COPPA
          </Link>{' '}
          |{' '}
          <Link component={RouterLink} to={ROUTES.FERPA} color="inherit">
            FERPA
          </Link>
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ display: 'block', mt: 0.5, opacity: 0.5 }}
        >
          {versionLabel}
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
