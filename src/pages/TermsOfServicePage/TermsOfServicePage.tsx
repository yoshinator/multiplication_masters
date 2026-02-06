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

const TermsOfServicePage = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ my: 4, p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" gutterBottom>
          Terms of Service
        </Typography>

        <Typography variant="body2" color="text.secondary" component="p">
          Last updated: February 6, 2026
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          By using Math Builders / Multiplication Masters (the “App”), you agree
          to these Terms. If you do not agree, do not use the App.
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
            <Link component={RouterLink} to={ROUTES.COPPA}>
              COPPA
            </Link>
            {' • '}
            <Link component={RouterLink} to={ROUTES.FERPA}>
              FERPA
            </Link>
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          1) The service
        </Typography>
        <Typography variant="body1" component="p">
          The App provides practice for multiplication facts using a time-driven
          spaced repetition system. The App may store progress, session
          summaries, and settings to help personalize practice.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          2) Eligibility and children
        </Typography>
        <Typography variant="body1" component="p">
          The App is intended for a general audience and may be used by
          students. If you are a parent/guardian, you are responsible for
          supervising your child’s use. For additional information about
          children’s privacy, see our{' '}
          <Link component={RouterLink} to={ROUTES.COPPA}>
            COPPA notice
          </Link>
          .
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          3) Accounts and authentication
        </Typography>
        <Typography variant="body1" component="p">
          You may use the App anonymously or sign in using supported methods
          (Google or email link). You are responsible for maintaining the
          confidentiality of your device and for all activity that occurs under
          your account.
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          Anonymous accounts
        </Typography>
        <Typography variant="body1" component="p">
          Anonymous usage may store progress tied to an anonymous identifier.
          Anonymous progress can be lost if you clear browser storage,
          uninstall, or lose access to the device.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          4) Acceptable use
        </Typography>
        <Typography variant="body1" component="p">
          You agree not to misuse the App. For example, you will not:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText
              primary="Attempt to access or interfere with systems"
              secondary="Including probing, scanning, or testing vulnerabilities, bypassing access controls, or attempting to gain unauthorized access to accounts or data."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Abuse the service"
              secondary="Including sending automated traffic, scraping, or otherwise imposing an unreasonable load."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Upload harmful content"
              secondary="Including malware, infringing content, or content that violates applicable law."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          5) User content (scene builder uploads)
        </Typography>
        <Typography variant="body1" component="p">
          If the App allows you to upload images or other assets (e.g., for
          custom scenes), you retain ownership of your content. You grant us a
          limited, worldwide, non-exclusive license to host, store, reproduce,
          and display that content solely to operate and provide the App.
        </Typography>
        <Typography variant="body1" component="p">
          You represent that you have the rights to upload the content and that
          it does not violate others’ rights.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          6) Third-party services
        </Typography>
        <Typography variant="body1" component="p">
          The App relies on third-party services such as Firebase (Google) for
          authentication, databases, file storage, and analytics. Your use of
          those services may be subject to their terms and privacy practices.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          7) Disclaimers
        </Typography>
        <Typography variant="body1" component="p">
          THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT
          PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED,
          INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </Typography>
        <Typography variant="body1" component="p">
          The App is an educational practice tool and does not guarantee
          learning outcomes. You are responsible for how you use the App.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          8) Limitation of liability
        </Typography>
        <Typography variant="body1" component="p">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, OR GOODWILL, ARISING
          OUT OF OR RELATED TO YOUR USE OF THE APP.
        </Typography>
        <Typography variant="body1" component="p">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ALL
          CLAIMS RELATED TO THE APP WILL NOT EXCEED THE GREATER OF (A) $10 OR
          (B) THE AMOUNT YOU PAID US (IF ANY) TO USE THE APP IN THE 12 MONTHS
          BEFORE THE EVENT GIVING RISE TO THE CLAIM.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          9) Indemnity
        </Typography>
        <Typography variant="body1" component="p">
          To the extent permitted by law, you agree to indemnify and hold us
          harmless from claims, liabilities, damages, losses, and expenses
          (including reasonable attorneys’ fees) arising out of your misuse of
          the App, your violation of these Terms, or your infringement of any
          rights of another.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          10) Termination
        </Typography>
        <Typography variant="body1" component="p">
          We may suspend or terminate access to the App at any time if we
          believe you have violated these Terms or if necessary to protect the
          App, users, or third parties. You may stop using the App at any time.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          11) Changes
        </Typography>
        <Typography variant="body1" component="p">
          We may update these Terms from time to time. We will change the “Last
          updated” date above and may provide additional notice in the App if
          required.
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          12) Governing law / venue
        </Typography>
        <Typography variant="body1" component="p">
          These Terms are governed by the laws of your local jurisdiction unless
          applicable law requires otherwise. If you operate the App as a
          business, consider customizing this section with a specific governing
          law and venue with counsel.
        </Typography>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          13) Contact
        </Typography>
        <Typography variant="body1" component="p">
          Questions? Use the in-app Feedback button or email{' '}
          <Link href="mailto:support@mathbuilders.com">
            support@mathbuilders.com
          </Link>{' '}
        </Typography>
      </Paper>
    </Container>
  )
}

export default TermsOfServicePage
