import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Stack,
  Link,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useAuthActions } from '../../hooks/useAuthActions'

export default function HomePage() {
  const { authStatus, isLoading } = useUser()
  const navigate = useNavigate()
  const { loginAnonymously } = useAuthActions()
  const theme = useTheme()

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (authStatus === 'signedIn') navigate(ROUTES.TRAIN)
  }, [authStatus, navigate])

  return isLoading ? (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress size={80} role="status" aria-label="Loading" />
    </Box>
  ) : (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* ============================ */}
      {/* HERO SECTION */}
      {/* ============================ */}
      <Box
        sx={{
          pt: { xs: 12, md: 18 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '60%',
            height: '120%',
            background: `radial-gradient(circle, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, transparent 70%)`,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={8} alignItems="center">
            {/* LEFT SIDE COPY */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mb: 3,
                  letterSpacing: '-0.02em',
                }}
              >
                Master math facts —{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  fast.
                </Box>
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.8,
                  fontWeight: 500,
                  maxWidth: 500,
                  lineHeight: 1.6,
                }}
              >
                When facts are not automatic, harder math turns into a
                memory-and-attention battle. Math Builders builds fast fact
                retrieval across multiplication, division, addition, and
                subtraction with short, adaptive sessions so students can focus
                on real problem solving.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={loginAnonymously}
                  sx={{
                    px: 4,
                    py: 1.8,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    boxShadow: `0 8px 20px ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                  }}
                >
                  Start 5-Min Practice
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={scrollToHowItWorks}
                  sx={{
                    px: 4,
                    py: 1.8,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  See How It Works
                </Button>
              </Stack>

              <Typography
                variant="body2"
                sx={{ mt: 3, opacity: 0.6, fontWeight: 500 }}
              >
                Build automaticity fast &bull; No credit card required
              </Typography>
            </Grid>

            {/* RIGHT SIDE IMAGE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                  p: 4,
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg)',
                  },
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/MathBuildersPracticePage.png"
                  alt="Math Builders practice interface"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================ */}
      {/* WHY SMART PRACTICE WORKS */}
      {/* ============================ */}
      <Box
        id="how-it-works"
        sx={{ bgcolor: 'background.paper', py: { xs: 10, md: 16 } }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 10 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Why Automaticity Changes Everything
            </Typography>
            <Typography
              variant="h6"
              sx={{ opacity: 0.7, lineHeight: 1.6, fontWeight: 400 }}
            >
              When recall is slow, working memory gets consumed by basic
              calculation and students struggle to keep up with multi-step
              problems. Our app uses a scientifically proven method called{' '}
              <Box
                component="span"
                sx={{ color: 'primary.main', fontWeight: 700 }}
              >
                Spaced Repetition
              </Box>{' '}
              to build automaticity efficiently.
            </Typography>
            <Box
              sx={{
                mt: 4,
                textAlign: 'left',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Research highlights
              </Typography>
              <Box component="ul" sx={{ pl: 2.5, mb: 0, color: 'text.secondary' }}>
                <li>
                  <Link
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3779611/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fuchs et al. (2012)
                  </Link>
                  : fluency building supports broader math performance.
                </li>
                <li>
                  <Link
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2682421/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Powell et al. (2009)
                  </Link>
                  : strategic practice improves calculation skills.
                </li>
                <li>
                  <Link
                    href="https://link.springer.com/article/10.1186/s41235-022-00451-0"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Dotan et al. (2022)
                  </Link>
                  : automaticity supports complex reasoning.
                </li>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={8} alignItems="center">
            {/* TEXT CONTENT */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={5}>
                <Box>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, opacity: 1 }}
                    >
                      ⚡ The "Just-in-Time" Method
                    </Typography>
                  </Stack>
                  <Typography sx={{ opacity: 0.7, pl: 0 }}>
                    We track every fact individually. If your child answers
                    7 × 8 correctly (or 12 ÷ 3, 9 + 6, 15 − 7), we wait until the
                    moment they are just about to forget it (e.g., 3 days later)
                    to show it again.
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, opacity: 1 }}
                    >
                      🔄 Smart Recovery
                    </Typography>
                  </Stack>
                  <Typography sx={{ opacity: 0.7, pl: 0 }}>
                    Missed a fact? No problem. The system instantly detects the
                    slip-up and brings that specific problem back
                    sooner—reinforcing the memory exactly when it's needed most
                    until it's solid.
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, opacity: 1 }}
                    >
                      ⏱️ Efficiency First
                    </Typography>
                  </Stack>
                  <Typography sx={{ opacity: 0.7, pl: 0 }}>
                    This means your child spends 100% of their study time on the
                    facts they struggle with, and 0% of their time reviewing
                    easy facts they have already mastered.
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, opacity: 1 }}
                    >
                      🧠 Long-Term Memory
                    </Typography>
                  </Stack>
                  <Typography sx={{ opacity: 0.7, pl: 0 }}>
                    By gradually increasing the gap between reviews (1 day → 3
                    days → 1 week → 1 month), we move information from
                    short-term memory into permanent long-term storage.
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* IMAGE CONTENT */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  bgcolor: theme.palette.common.white,
                  p: 4,
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/MathBuildersParentExplainer.png"
                  alt="Spaced Repetition Explainer"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 2,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  mt: 3,
                  textAlign: 'center',
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                The Result: Your child learns the entire multiplication table in
                less time, with less frustration.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================ */}
      {/* MULTIPLICATION TABLES FEATURE */}
      {/* ============================ */}
      <Box sx={{ py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                }}
              >
                Multiplication is the lingua franca of math.
              </Typography>
              <Typography sx={{ opacity: 0.8, mb: 4, fontSize: '1.1rem' }}>
                It is the quiet language behind fractions, algebra, and
                geometry. When the tables are fluent, everything else speaks
                clearly. Math Builders makes that fluency feel inevitable:
                steady, rhythmic practice that turns effort into instinct.
              </Typography>
              <Typography sx={{ opacity: 0.8, fontSize: '1.1rem' }}>
                Give students a vocabulary they can trust. Give them momentum
                that carries into every new unit.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  bgcolor: 'background.paper',
                  p: 4,
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/MathBuildersPracticePage.png"
                  alt="Fluent multiplication practice"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================ */}
      {/* GAMIFICATION / MOTIVATION */}
      {/* ============================ */}
      <Box sx={{ py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Grid
            container
            spacing={8}
            alignItems="center"
            direction={{ xs: 'column-reverse', md: 'row' }}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  bgcolor: 'background.paper',
                  p: 4,
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/MathBuildersSummaryPage.png"
                  alt="Session Summary and Rewards"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                }}
              >
                Motivation That Sticks
              </Typography>
              <Typography sx={{ opacity: 0.8, mb: 4, fontSize: '1.1rem' }}>
                Every practice session earns progress towards new levels and
                visual rewards. This isn't a distraction—it's a{' '}
                <strong>reward system built on modern behavior design</strong>{' '}
                that keeps learners consistently engaged without feeling like
                "work".
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: 'none',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        ⭐ Visible Progress
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Kids see their mastery grow daily, turning "I can't"
                        into "I did it".
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: 'none',
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        📈 Consistent Habits
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Short sessions (5 mins) mean it's easy to fit into a
                        busy evening routine.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================ */}
      {/* STATS / PROGRESS */}
      {/* ============================ */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                }}
              >
                See Mastery, Not Guesswork
              </Typography>
              <Typography sx={{ opacity: 0.8, mb: 4, fontSize: '1.1rem' }}>
                No more guessing. See exactly which facts are mastered and which
                need work. Our detailed statistics dashboard tracks lifetime
                accuracy, response times, and mastery levels.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  bgcolor: theme.palette.common.white,
                  p: 4,
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/MathBuildersStatsPage.png"
                  alt="Progress Tracking Dashboard"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================ */}
      {/* ANYWHERE ACCESS / DEVICES */}
      {/* ============================ */}
      <Box sx={{ py: { xs: 10, md: 16 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Practice Anywhere, Stay Consistent
            </Typography>
            <Typography
              variant="h6"
              sx={{ opacity: 0.7, lineHeight: 1.6, fontWeight: 400 }}
            >
              Whether in the classroom or on the couch, our platform adapts to
              your lifestyle. Consistent practice is key to{' '}
              <strong>learning math facts</strong>, so we made it easy to play
              on any device.
            </Typography>
          </Box>

          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  mb: 3,
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/PlayingMathBuilders.jpg"
                  alt="Child learning math facts on desktop computer"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                🖥️ Desktop & Classroom Ready
              </Typography>
              <Typography sx={{ opacity: 0.7 }}>
                Perfect for focused study sessions at home or in school. The
                immersive full-screen experience helps children concentrate on
                mastering multiplication tables without distractions.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  mb: 3,
                }}
              >
                <Box
                  component="img"
                  src="/assets/homepage/PlayingOnPhoneMathBuilders.jpg"
                  alt="Child practicing math facts on mobile phone"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                📱 Mobile Learning on the Go
              </Typography>
              <Typography sx={{ opacity: 0.7 }}>
                Turn car rides or waiting rooms into productive practice. Our
                mobile-friendly interface makes learning math facts accessible
                anywhere, fitting seamlessly into busy family schedules.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================ */}
      {/* CTA SECTION */}
      {/* ============================ */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 10, md: 14 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Build automaticity in 5 minutes.
          </Typography>
          <Typography
            sx={{
              opacity: 0.9,
              mb: 5,
              fontSize: '1.2rem',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Fast fact retrieval frees attention for real problem solving.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={loginAnonymously}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              borderRadius: 3,
              fontWeight: 800,
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.9),
              },
            }}
          >
            Start 5-Min Practice
          </Button>
        </Container>
      </Box>
    </Box>
  )
}
