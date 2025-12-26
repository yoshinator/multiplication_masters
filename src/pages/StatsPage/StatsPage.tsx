import { type FC } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  LinearProgress,
} from '@mui/material'
import {
  History,
  Functions,
  Speed,
  DoneAll,
  ErrorOutline,
  EmojiEvents,
  Timeline,
} from '@mui/icons-material'
import { useUser } from '../../contexts/userContext/useUserContext'
import StatsCard from '../../components/StatsPanel/StatsCard'

const StatsPage: FC = () => {
  const { user } = useUser()

  if (!user) return null

  const totalQuestions =
    (user.lifetimeCorrect || 0) + (user.lifetimeIncorrect || 0)
  const accuracy =
    totalQuestions > 0
      ? Math.round((user.lifetimeCorrect / totalQuestions) * 100)
      : 0

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" gutterBottom>
          Statistics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress and lifetime achievements.
        </Typography>
      </Box>

      {/* Level Progress Section */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <EmojiEvents sx={{ fontSize: 40, color: '#FFD700' }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Level {user.activeGroup}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mastery Progress
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={user.currentLevelProgress || 0}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'primary.main',
              borderRadius: 5,
            },
          }}
        />
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Typography variant="caption" fontWeight="bold">
            {Math.round(user.currentLevelProgress || 0)}%
          </Typography>
        </Box>
      </Card>

      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
        Lifetime Performance
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<History color="primary" />}
            label="Total Sessions"
            value={user.totalSessions}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<Functions color="secondary" />}
            label="Total Questions"
            value={totalQuestions}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<Speed color="info" />}
            label="Avg Accuracy"
            value={`${accuracy}%`}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<DoneAll color="success" />}
            label="Lifetime Correct"
            value={user.lifetimeCorrect}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<ErrorOutline color="error" />}
            label="Lifetime Incorrect"
            value={user.lifetimeIncorrect}
            color="error.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<Timeline sx={{ color: 'warning.main' }} />}
            label="Current Level"
            value={user.activeGroup}
            color="warning.main"
          />
        </Grid>
      </Grid>
    </Container>
  )
}

export default StatsPage
