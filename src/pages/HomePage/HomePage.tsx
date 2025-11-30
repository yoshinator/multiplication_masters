import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from '@mui/material'

export default function HomePage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8 }}>
      <Container maxWidth="lg">
        {/* HERO SECTION */}
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              Master Multiplication <br />
              <span style={{ color: '#2962ff' }}>Lightning Fast</span>
            </Typography>

            <Typography variant="h5" sx={{ mb: 3, maxWidth: 600 }}>
              The only multiplication system powered by a time-adaptive
              <strong> Spaced Repetition Engine</strong> designed to build
              reflex-level recall in kids, students, and adults.
            </Typography>

            <Grid container spacing={2}>
              <Grid>
                <Button variant="contained" size="large">
                  Start Free
                </Button>
              </Grid>
              <Grid>
                <Button variant="outlined" size="large">
                  See How It Works
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Illustration Placeholder */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                width: '100%',
                height: 360,
                borderRadius: 4,
                bgcolor: 'white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              }}
            >
              {/* Replace this with your builder-scene preview later */}
            </Box>
          </Grid>
        </Grid>

        {/* SOCIAL PROOF */}
        <Box sx={{ textAlign: 'center', mt: 10, mb: 6 }}>
          <Typography variant="h6" sx={{ opacity: 0.7 }}>
            Trusted by Parents, Teachers, Homeschool Families, and Schools
            Looking to Build Rock-Solid Math Fluency.
          </Typography>
        </Box>

        {/* FEATURE GRID */}
        <Grid container spacing={4} sx={{ mb: 12 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🔥 Time-Adaptive Learning
                </Typography>
                <Typography sx={{ opacity: 0.75, minHeight: 150 }}>
                  Questions get harder or easier based on response speed. We
                  tighten spacing when the brain needs it — and expand spacing
                  when mastery is detected automatically.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🧠 Real Neuroscience
                </Typography>
                <Typography sx={{ opacity: 0.75, minHeight: 150 }}>
                  Spaced repetition has been shown in over 800+ peer-reviewed
                  studies to boost retention and reduce study time by up to 70%.
                  We’ve optimized it specifically for multiplication facts.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🚀 Lightning Reflex Training
                </Typography>
                <Typography sx={{ opacity: 0.75, minHeight: 150 }}>
                  Kids and adults build sub-2-second recall speed using our
                  reaction-time-driven Leitner + SM-2 hybrid system.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* AUDIENCE SECTIONS */}
        <Grid container spacing={8} sx={{ mb: 14 }}>
          {/* PARENTS SECTION */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              For Parents
            </Typography>
            <Typography sx={{ mb: 2, opacity: 0.8, maxWidth: 480 }}>
              Give your child the confidence boost of *knowing* their math
              facts. No more tears. No more frustration. Just consistent
              progress and a fun, motivating learning loop powered by
              neuroscience.
            </Typography>
            <Typography sx={{ opacity: 0.8 }}>
              Their background scene grows with every milestone — making
              practice feel like a game, not homework.
            </Typography>
          </Grid>

          {/* TEACHERS SECTION */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              For Teachers & Schools
            </Typography>
            <Typography sx={{ mb: 2, opacity: 0.8, maxWidth: 480 }}>
              Replace inefficient drill worksheets with a proven
              spaced-repetition system that adapts to each student’s strengths
              and weaknesses.
            </Typography>
            <Typography sx={{ opacity: 0.8 }}>
              Track mastery, accuracy, response time, and fluency benchmarks —
              automatically. Students stay motivated. Teachers get real
              insights.
            </Typography>
          </Grid>
        </Grid>

        {/* ADULTS SECTION */}
        <Box sx={{ mb: 14, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            For Adults, Professionals, and Lifelong Learners
          </Typography>
          <Typography sx={{ maxWidth: 700, mx: 'auto', opacity: 0.8 }}>
            Whether you’re preparing for a job exam, improving mental math for
            business, or simply want instant recall — this system builds rapid
            fluency using the same algorithms used by top memory athletes.
          </Typography>
        </Box>

        {/* SCIENCE SECTION */}
        <Box sx={{ mb: 12 }}>
          <Card sx={{ p: 5 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              The Science Behind It
            </Typography>

            <Typography sx={{ fontSize: '1.1rem', opacity: 0.85, mb: 2 }}>
              Most apps drill facts randomly. That wastes time.
            </Typography>

            <Typography sx={{ fontSize: '1.1rem', opacity: 0.85, mb: 2 }}>
              Our engine is different: it uses a time-driven Leitner system
              enhanced with SM-2 — the algorithm behind Anki, SuperMemo, and
              modern memory science.
            </Typography>

            <Typography sx={{ fontSize: '1.1rem', opacity: 0.85 }}>
              The result? Students learn at the exact moment their brains are
              most ready — maximizing retention while minimizing effort.
            </Typography>
          </Card>
        </Box>

        {/* CTA SECTION */}
        <Box sx={{ textAlign: 'center', mt: 14, mb: 20 }}>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 800 }}>
            Build Math Mastery that Lasts a Lifetime
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.75, mb: 4 }}>
            Start your first session now — it only takes 60 seconds.
          </Typography>

          <Button
            variant="contained"
            size="large"
            sx={{ px: 6, py: 2, fontSize: '1.2rem' }}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
