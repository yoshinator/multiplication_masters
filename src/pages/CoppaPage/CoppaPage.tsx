import {
  Alert,
  Box,
  Container,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'

const CoppaPage = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ my: 4, p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" gutterBottom>
          Children’s Privacy (COPPA Notice)
        </Typography>

        <Typography variant="body2" color="text.secondary" component="p">
          Last updated: February 6, 2026
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This COPPA notice provides additional information for parents and
          guardians about children’s privacy. It supplements our{' '}
          <Link component={RouterLink} to={ROUTES.PRIVACY}>
            Privacy Policy
          </Link>
          .
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Related documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Link component={RouterLink} to={ROUTES.PRIVACY}>
              Privacy Policy
            </Link>
            {' • '}
            <Link component={RouterLink} to={ROUTES.TERMS}>
              Terms of Service
            </Link>
            {' • '}
            <Link component={RouterLink} to={ROUTES.FERPA}>
              FERPA
            </Link>
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          1) Is the App directed to children under 13?
        </Typography>
        <Typography variant="body1" component="p">
          The App is an educational practice tool intended for a general
          audience and may be used by students. We do not intentionally target
          children under 13 with advertising or marketing.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          2) What information might be collected?
        </Typography>
        <Typography variant="body1" component="p">
          The App may collect and store:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText
              primary="Practice/progress data"
              secondary="Performance on multiplication practice (e.g., correct/incorrect counts, response times, and spaced-repetition scheduling data)."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Account identifiers"
              secondary="An anonymous identifier or a sign-in identifier if a parent/guardian chooses to sign in via Google or email link."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Technical data"
              secondary="Basic device/browser information collected by our service providers (e.g., Firebase) for security and reliability."
            />
          </ListItem>
        </List>

        <Typography variant="body1" component="p">
          We do not require a child to provide more information than is
          reasonably necessary to use the App.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          3) Parental choices and control
        </Typography>
        <Typography variant="body1" component="p">
          A parent/guardian may request to:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText
              primary="Review or delete information"
              secondary="Request access to, deletion of, or restriction on further collection/use of a child’s information."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Stop account use"
              secondary="Ask us to disable a child’s account or remove stored progress."
            />
          </ListItem>
        </List>

        <Typography variant="body1" component="p">
          To make a request, contact us using the in-app Feedback button or
          email{' '}
          <Link href="mailto:support@mathbuilders.com">
            support@mathbuilders.com
          </Link>{' '}
          We may need to verify you are the parent/guardian or account holder
          before fulfilling a request.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          4) Schools and COPPA
        </Typography>
        <Typography variant="body1" component="p">
          If the App is used in a school context, the school may act as a
          parent/guardian agent for consent under COPPA depending on the
          circumstances. Please see our{' '}
          <Link component={RouterLink} to={ROUTES.FERPA}>
            FERPA notice
          </Link>{' '}
          for additional information for educational institutions.
        </Typography>
      </Paper>
    </Container>
  )
}

export default CoppaPage
