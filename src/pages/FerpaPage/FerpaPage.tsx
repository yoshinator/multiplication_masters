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

const FerpaPage = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ my: 4, p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" gutterBottom>
          Educational Privacy (FERPA Notice)
        </Typography>

        <Typography variant="body2" color="text.secondary" component="p">
          Last updated: February 6, 2026
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This FERPA notice is intended for schools, districts, and educators.
          It supplements our{' '}
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
            <Link component={RouterLink} to={ROUTES.COPPA}>
              COPPA
            </Link>
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          1) Overview
        </Typography>
        <Typography variant="body1" component="p">
          The App helps students practice multiplication facts and stores
          progress and performance data to adapt practice over time. Depending
          on how the App is deployed and used, student data may be considered an
          “education record” under the Family Educational Rights and Privacy Act
          (FERPA).
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          2) What data the App may process for students
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText
              primary="Student identifiers"
              secondary="A username (which may be randomly generated) and a backend account identifier. Depending on configuration, an email address may be used for sign-in."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Learning/progress data"
              secondary="Multiplication fact performance, review scheduling fields, response-time statistics, and session summaries."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Content uploads (optional)"
              secondary="If enabled, students may upload images/assets for custom scenes; these may be stored in Firebase Storage."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Technical data"
              secondary="Device/browser information and diagnostic data collected by service providers for security and reliability."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          3) Roles and responsibilities
        </Typography>
        <Typography variant="body1" component="p">
          Schools/districts are typically the data controllers for student
          education records. The App operator is typically a service provider
          that processes data to provide the service.
        </Typography>
        <Typography variant="body1" component="p">
          If a school uses the App with student accounts, the school is
          responsible for:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText
              primary="Obtaining required consents"
              secondary="Including any parent/guardian consent required under FERPA/COPPA and local law."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Providing notices"
              secondary="Providing any required privacy notices to parents/eligible students."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Account provisioning"
              secondary="Ensuring student sign-in methods are appropriate for the student population and the school’s policies."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          4) Access, correction, and deletion requests
        </Typography>
        <Typography variant="body1" component="p">
          If a school is managing student accounts, requests to access, correct,
          or delete student data should generally be routed through the school
          in accordance with its FERPA policies.
        </Typography>
        <Typography variant="body1" component="p">
          For operational help, contact us via the in-app Feedback button or
          email{' '}
          <Link href="mailto:support@mathbuilders.com">
            support@mathbuilders.com
          </Link>{' '}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          5) Data security
        </Typography>
        <Typography variant="body1" component="p">
          We use reasonable safeguards designed to protect student data;
          however, no system is perfectly secure. Schools should evaluate
          whether the App meets their compliance, security, and procurement
          requirements.
        </Typography>
      </Paper>
    </Container>
  )
}

export default FerpaPage
