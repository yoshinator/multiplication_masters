import { useMemo, type FC } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  LinearProgress,
  IconButton,
} from '@mui/material'
import {
  History,
  Functions,
  Speed,
  DoneAll,
  ErrorOutline,
  EmojiEvents,
  Timeline,
  HelpOutline,
} from '@mui/icons-material'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import StatsCard from '../../components/StatsPanel/StatsCard'
import MissedFactCard from '../../components/StatsPanel/MissedFactCard'

const StatsPage: FC = () => {
  const { user } = useUser()
  const { userCards } = useFirebaseContext()

  const topTenMissedMultiplication = useMemo(
    () =>
      [...userCards]
        .sort((a, b) => {
          if (b.incorrect === a.incorrect) {
            return b.seen - a.seen
          }
          return b.incorrect - a.incorrect
        })
        .slice(0, 10)
        .filter((card) => card.incorrect > 0),
    [userCards]
  )

  const totalQuestions =
    (user?.lifetimeCorrect || 0) + (user?.lifetimeIncorrect || 0)
  const accuracy =
    totalQuestions > 0
      ? Math.round(((user?.lifetimeCorrect || 0) / totalQuestions) * 100)
      : 0

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#stats-title',
          popover: {
            title: 'Statistics',
            description: 'Track your progress and lifetime achievements here.',
          },
        },
        {
          element: '#level-progress',
          popover: {
            title: 'Level Progress',
            description:
              'See how close you are to mastering the current level.',
          },
        },
        {
          element: '#lifetime-stats',
          popover: {
            title: 'Performance Metrics',
            description:
              'View detailed stats about your accuracy and sessions.',
          },
        },
        {
          element: '#most-missed-stats',
          popover: {
            title: 'See Most Missed Facts',
            description:
              'See your most missed facts. How many times they were missed and how many times they were seen. Over time you will see up to 10 missed facts.',
          },
        },
      ],
    })
    driverObj.drive()
  }

  return (
    <Container
      maxWidth="md"
      sx={{ py: { xs: 2, sm: 4 }, mb: { xs: 5, sm: 'inherit' } }}
    >
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            id="stats-title"
            variant="h4"
            fontWeight="800"
            gutterBottom
          >
            Statistics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your progress and lifetime achievements.
          </Typography>
        </Box>
        <IconButton onClick={startTour} color="primary" aria-label="start tour">
          <HelpOutline />
        </IconButton>
      </Box>

      {/* Level Progress Section */}
      <Card
        id="level-progress"
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
              Level {user?.activeGroup}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mastery Progress
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={user?.currentLevelProgress || 0}
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
            {Math.round(user?.currentLevelProgress || 0)}%
          </Typography>
        </Box>
      </Card>

      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
        Lifetime Performance
      </Typography>

      <Grid container spacing={2} id="lifetime-stats">
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<History color="primary" />}
            label="Total Sessions"
            value={user?.totalSessions ?? 0}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<Functions color="secondary" />}
            label="Total Questions"
            value={totalQuestions ?? 0}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<Speed color="info" />}
            label="Avg Accuracy"
            value={`${accuracy ?? 0}%`}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<DoneAll color="success" />}
            label="Lifetime Correct"
            value={user?.lifetimeCorrect ?? 0}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<ErrorOutline color="error" />}
            label="Lifetime Incorrect"
            value={user?.lifetimeIncorrect ?? 0}
            color="error.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatsCard
            icon={<Timeline sx={{ color: 'warning.main' }} />}
            label="Current Level"
            value={user?.activeGroup ?? 0}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ my: 2 }}>
        Most Missed Facts
      </Typography>

      <Grid container spacing={2} id="most-missed-stats">
        {topTenMissedMultiplication.map((card) => (
          <Grid size={{ xs: 6, sm: 4 }} key={card.expression}>
            <MissedFactCard
              expression={card.expression}
              incorrect={card.incorrect}
              seen={card.seen}
              avgResponseTime={card.avgResponseTime}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default StatsPage
