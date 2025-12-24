import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from '@mui/material'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'

export default function HomePage() {
  const { authStatus } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (authStatus === 'signedIn') navigate(ROUTES.TRAIN)
  }, [authStatus, navigate])
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8 }}>
      <Container maxWidth="lg">
        {/* ============================ */}
        {/* HERO SECTION */}
        {/* ============================ */}
        <Grid
          container
          spacing={6}
          alignItems="center"
          sx={{ pb: { xs: 6, md: 10 } }}
        >
          {/* LEFT SIDE */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h2"
              sx={{
                mb: 2,
                fontSize: { xs: '2.3rem', md: '3rem' },
                fontWeight: 800,
              }}
            >
              Turn Multiplication Into a{' '}
              <Typography
                component="span"
                sx={{ color: 'primary.main', fontWeight: 800 }}
              >
                Lifetime Superpower
              </Typography>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mb: 3,
                opacity: 0.8,
                maxWidth: 560,
                fontSize: { xs: '1.05rem', md: '1.25rem' },
              }}
            >
              A time-adaptive{' '}
              <Typography component="span" sx={{ fontWeight: 700, opacity: 1 }}>
                Spaced Repetition Memory Engine
              </Typography>{' '}
              that builds reflex-level recall in kids, students, and adults — in
              just 5–10 minutes a day.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ px: 4, py: 1.6, borderRadius: 3 }}
                >
                  Start Free
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ px: 4, py: 1.6, borderRadius: 3 }}
                >
                  See How It Works
                </Button>
              </Grid>
            </Grid>

            {/* Micro-testimonial under hero */}
            <Typography
              sx={{
                mt: 2,
                fontSize: '0.9rem',
                color: 'text.secondary',
                maxWidth: 420,
              }}
            >
              “In two weeks, homework went from tears to, ‘I’ve got this.’” —{' '}
              <Typography component="span" sx={{ fontWeight: 600 }}>
                Parent of a 3rd grader
              </Typography>
            </Typography>
          </Grid>

          {/* RIGHT SIDE IMAGE */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                width: '100%',
                height: { xs: 260, md: 360 },
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              }}
            >
              <Box
                component="img"
                src="https://placehold.co/900x600?text=Practice+Session+Dashboard"
                alt="Multiplication Masters dashboard preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* ============================ */}
        {/* SOCIAL PROOF */}
        {/* ============================ */}
        <Box sx={{ textAlign: 'center', mt: 6, mb: 8 }}>
          <Typography
            variant="h6"
            sx={{
              opacity: 0.6,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              px: { xs: 2, md: 0 },
            }}
          >
            Built on the same memory principles used by medical students and
            memory athletes — designed for multiplication.
          </Typography>

          <Typography
            sx={{
              mt: 3,
              fontSize: '0.95rem',
              color: 'text.secondary',
            }}
          >
            “My 4th graders finally stopped counting on their fingers.”
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {' '}
              — 4th Grade Teacher
            </Typography>
          </Typography>

          <Box
            sx={{
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
            }}
          >
            <Box
              component="img"
              src="https://placehold.co/140x40?text=School+Logo"
              alt="School logo placeholder"
              sx={{ opacity: 0.6 }}
            />
            <Box
              component="img"
              src="https://placehold.co/140x40?text=District+Logo"
              alt="District logo placeholder"
              sx={{ opacity: 0.6 }}
            />
            <Box
              component="img"
              src="https://placehold.co/140x40?text=Homeschool+Group"
              alt="Homeschool logo placeholder"
              sx={{ opacity: 0.6 }}
            />
          </Box>
        </Box>

        {/* ============================ */}
        {/* FEATURE GRID */}
        {/* ============================ */}
        <Grid container spacing={4} sx={{ mb: 14 }}>
          {/* FEATURE 1 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🔥 Time-Adaptive Memory Engine
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  Facts appear exactly when the brain is about to forget them.
                  Spacing automatically stretches as mastery increases — saving
                  time while locking multiplication into long-term memory.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* FEATURE 2 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🧠 Backed by Cognitive Science
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  Built on the spaced-repetition research used by medical
                  students to memorize thousands of facts and by memory athletes
                  to perform on stage — tuned specifically for multiplication
                  tables up to 24×24.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* FEATURE 3 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🚀 Lightning Reflex Training
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  Our Leitner + SM-2 hybrid scheduler adapts to both accuracy
                  and response time. Kids and adults build sub-2-second recall,
                  turning hesitation into instant “I know this.”
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tiny testimonial after features */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            sx={{ fontSize: '0.95rem', color: 'text.secondary', px: 2 }}
          >
            “It feels like the app knows exactly which facts my students are
            shaky on, and it quietly fixes them.”{' '}
            <Typography component="span" sx={{ fontWeight: 600 }}>
              — 5th Grade Teacher
            </Typography>
          </Typography>
        </Box>

        {/* GAMIFICATION SECTION */}
        <Box sx={{ textAlign: 'center', mb: 14 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>
            Motivation That Actually Works
          </Typography>

          <Typography sx={{ maxWidth: 700, mx: 'auto', opacity: 0.8, mb: 4 }}>
            Every practice session earns new items for your personalized scene —
            a garden, spaceport, farm, or workshop that grows as you master your
            multiplication facts. This isn't a game. It's a{' '}
            <strong>reward system built on modern behavior design </strong>
            that keeps learners consistently engaged.
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ px: 4, pt: 4, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  🌱 Build Your World
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  Kids unlock new decorations, stickers, birds, plants, and
                  structures as their mastery grows — turning progress into
                  something they can see and feel.
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ px: 4, pt: 4, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  ⭐ Achievement Badges
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  Earn badges for accuracy streaks, fast sessions, perfect runs,
                  and milestone mastery. Students get hooked on improving —
                  naturally.
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ px: 4, pt: 4, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  🚀 Designed With Purpose
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>
                  It isn’t random gamification. Every reward is aligned with
                  true spaced-repetition intervals — reinforcing the habit loop
                  that leads to real fluency.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* ============================ */}
        {/* AUDIENCE SECTIONS */}
        {/* ============================ */}
        <Grid container spacing={10} sx={{ mb: 14 }}>
          {/* PARENTS */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              For Parents
            </Typography>
            <Typography sx={{ opacity: 0.8, mb: 2 }}>
              Give your child the quiet confidence of truly knowing their math
              facts. No more tears, no more “I’m just bad at math” — just
              steady, science-backed progress.
            </Typography>
            <Typography sx={{ opacity: 0.8 }}>
              As they master new facts, their background scene evolves, turning
              practice into a game loop they actually want to come back to.
            </Typography>
          </Grid>

          {/* TEACHERS */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              For Teachers & Schools
            </Typography>
            <Typography sx={{ opacity: 0.8, mb: 2 }}>
              Replace one-size-fits-all drill worksheets with adaptive,
              individualized practice. Every student sees the right fact at the
              right time for their brain.
            </Typography>
            <Typography sx={{ opacity: 0.8 }}>
              Track accuracy, speed, and fluency benchmarks automatically, and
              see which facts each student needs help with — at a glance.
            </Typography>
          </Grid>

          {/* TEACHER DASHBOARD IMAGE */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              }}
            >
              <Box
                component="img"
                src="https://placehold.co/600x400?text=Teacher+Dashboard+Analytics"
                alt="Teacher dashboard mockup"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* ============================ */}
        {/* ADULTS SECTION */}
        {/* ============================ */}
        <Box sx={{ mb: 14, textAlign: 'center', px: { xs: 2, md: 0 } }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            For Adults & Professionals
          </Typography>
          <Typography
            sx={{
              maxWidth: 700,
              mx: 'auto',
              opacity: 0.8,
              fontSize: { xs: '1rem', md: '1.1rem' },
              mb: 4,
            }}
          >
            Maybe you never fully memorized your times tables. Maybe you want
            sharper mental math for business, finance, or everyday life. Our
            system uses the same techniques medical students rely on — applied
            to multiplication, so it finally sticks.
          </Typography>

          <Box
            sx={{
              width: '100%',
              maxWidth: 600,
              mx: 'auto',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            }}
          >
            <Box
              component="img"
              src="https://placehold.co/900x500?text=Adult+Learner+Session"
              alt="Adult learner practicing multiplication"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </Box>
        </Box>

        {/* ============================ */}
        {/* SCIENCE SECTION */}
        {/* ============================ */}
        <Box sx={{ mb: 10 }}>
          <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              The Science Behind the System
            </Typography>

            <Typography sx={{ opacity: 0.85, mb: 2, fontSize: '1.05rem' }}>
              Most apps drill facts randomly. That creates short bursts of
              improvement that fade away — and it wastes your child’s effort.
            </Typography>

            <Typography sx={{ opacity: 0.85, mb: 2, fontSize: '1.05rem' }}>
              Multiplication Masters uses a time-driven Leitner system enhanced
              with SM-2 — the spaced-repetition algorithm behind classic tools
              like SuperMemo and Anki. Each correct answer stretches the review
              interval; each struggle brings a fact back sooner.
            </Typography>

            <Typography sx={{ opacity: 0.85, fontSize: '1.05rem' }}>
              It’s the same core idea that helps medical students and memory
              competitors learn massive amounts of information — focused
              exclusively on multiplication facts, with kid-friendly design.
            </Typography>
          </Card>
        </Box>

        {/* ============================ */}
        {/* TESTIMONIALS SECTION */}
        {/* ============================ */}
        <Box sx={{ mb: 14 }}>
          <Typography
            variant="h4"
            sx={{ mb: 4, textAlign: 'center', px: { xs: 2, md: 0 } }}
          >
            What Parents and Teachers Are Saying
          </Typography>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography sx={{ mb: 2, fontWeight: 600 }}>
                    “The tears just stopped.”
                  </Typography>
                  <Typography sx={{ opacity: 0.8, mb: 1.5 }}>
                    “My son went from melting down over homework to finishing
                    his multiplication sheet on his own. The small daily
                    sessions actually fit our life.”
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
                  >
                    — Parent of a 3rd grader
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography sx={{ mb: 2, fontWeight: 600 }}>
                    “I can see exactly who needs help.”
                  </Typography>
                  <Typography sx={{ opacity: 0.8, mb: 1.5 }}>
                    “The dashboard shows me which facts each student is shaky
                    on. I don’t have to guess anymore — I can target small-group
                    time where it matters.”
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
                  >
                    — 5th Grade Teacher
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography sx={{ mb: 2, fontWeight: 600 }}>
                    “I finally closed the gap.”
                  </Typography>
                  <Typography sx={{ opacity: 0.8, mb: 1.5 }}>
                    “As an adult, I was always embarrassed about my times
                    tables. Ten minutes a night with this and I actually feel
                    sharp when I do mental math at work.”
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
                  >
                    — Adult learner
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* ============================ */}
        {/* CTA SECTION */}
        {/* ============================ */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 8,
            mb: 16,
            px: { xs: 2, md: 0 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              fontWeight: 800,
              fontSize: { xs: '1.9rem', md: '2.5rem' },
            }}
          >
            Build Math Mastery That Lasts a Lifetime
          </Typography>

          <Typography
            variant="h6"
            sx={{
              opacity: 0.75,
              mb: 4,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Create a free account in under 60 seconds. Your first personalized
            practice session is ready as soon as you log in.
          </Typography>

          <Button
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: 3,
            }}
          >
            Get Started Free
          </Button>

          <Typography
            sx={{
              mt: 2,
              fontSize: '0.9rem',
              color: 'text.secondary',
            }}
          >
            No credit card. Just smarter, calmer multiplication practice.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
