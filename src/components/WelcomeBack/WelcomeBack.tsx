import { type FC } from 'react'
import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useUser } from '../../contexts/user/useUserContext'

const WelcomeBack: FC = () => {
  const { startSession } = useCardSchedulerContext()
  const { user } = useUser()

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        mt: { xs: 8, sm: 24 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 560,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2.25} alignItems="center" textAlign="center">
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: -0.3 }}
          >
            Welcome back{user?.username ? `, ${user.username}` : ''}.
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 440 }}
          >
            Ready for a quick session? We’ll mix review + new cards to build
            fast, long-term recall.
          </Typography>

          <Button
            onClick={startSession}
            variant="contained"
            size="large"
            aria-label="Start session"
            sx={{
              mt: 0.5,
              px: 6,
              py: 1.6,
              fontWeight: 900,
              fontSize: '1.05rem',
              borderRadius: 999,
              textTransform: 'none',
              boxShadow: (theme) => theme.shadows[4],
            }}
          >
            Start Session
          </Button>

          <Typography variant="caption" color="text.secondary">
            Tip: You can change “Cards per Session” in your profile.
          </Typography>
        </Stack>
      </Card>
    </Box>
  )
}

export default WelcomeBack
