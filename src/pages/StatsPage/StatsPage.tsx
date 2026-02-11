import { useMemo, type FC } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { Box, Container, Grid, Typography, IconButton } from '@mui/material'
import {
  History,
  Functions,
  Speed,
  DoneAll,
  ErrorOutline,
  HelpOutline,
  TimerOutlined,
  HourglassTopOutlined,
  EmojiEvents,
} from '@mui/icons-material'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import StatsCard from '../../components/StatsPanel/StatsCard'
import MissedFactCard from '../../components/StatsPanel/MissedFactCard'
import PackMasteryPanel from '../../components/PackMasteryPanel/PackMasteryPanel'
import { countDueCardsInPack } from '../../contexts/cardScheduler/helpers/srsLogic'
import { MASTERY_BOX_THRESHOLD } from '../../constants/appConstants'

const StatsPage: FC = () => {
  const { user, activePackFactIds, activePackMeta } = useUser()
  const { userFacts } = useFirebaseContext()

  const { dueToday, dueTomorrow } = useMemo(() => {
    return countDueCardsInPack(userFacts, activePackMeta, activePackFactIds)
  }, [userFacts, activePackMeta, activePackFactIds])

  const topTenMissedMultiplication = useMemo(
    () =>
      [...userFacts]
        .sort((a, b) => {
          if (b.incorrect === a.incorrect) {
            return b.seen - a.seen
          }
          return b.incorrect - a.incorrect
        })
        .slice(0, 10)
        .filter((card) => card.incorrect > 0),
    [userFacts]
  )

  const factsMastered = useMemo(
    () => userFacts.filter((f) => f.box >= MASTERY_BOX_THRESHOLD).length,
    [userFacts]
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
      allowClose: true,
      steps: [
        {
          element: '#stats-title',
          popover: {
            title: 'Statistics',
            description: 'Track your progress and lifetime achievements here.',
          },
        },
        {
          element: '#pack-mastery-panel',
          popover: {
            title: 'Pack Mastery',
            description: 'See how close you are to mastering the current pack.',
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
          element: '#cards-due',
          popover: {
            title: 'Cards due to clear the queue',
            description:
              'The number of cards you have due today and tomorrow. Tomorrow includes todays cards.',
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

      <Box mb={4}>
        <PackMasteryPanel />
      </Box>

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
            icon={<EmojiEvents color="primary" />}
            label="Facts Mastered"
            value={factsMastered}
            color="primary.main"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ my: 2 }}>
        Number of Cards Due To Clear The Queue
      </Typography>
      <Grid container spacing={2} id="cards-due">
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatsCard
            icon={<HourglassTopOutlined color="success" />}
            label="Due Today"
            value={dueToday}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatsCard
            icon={<TimerOutlined color="warning" />}
            label="Due Tomorrow"
            value={dueTomorrow}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ my: 2 }}>
        Most Missed Facts
      </Typography>

      <Grid container spacing={2} id="most-missed-stats">
        {topTenMissedMultiplication.map((props) => (
          <Grid size={{ xs: 6, sm: 4 }} key={props.expression}>
            <MissedFactCard {...props} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default StatsPage
