import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ROUTES } from '../../constants/routeConstants'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '../../hooks/useAuthActions'

const LearnMorePage = () => {
  const navigate = useNavigate()
  const { loginAnonymously } = useAuthActions()

  const handleTryItOut = async () => {
    try {
      await loginAnonymously()
      navigate(ROUTES.TRAIN)
    } catch {
      // Errors are handled in the auth hook.
    }
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ my: 4, p: { xs: 3, sm: 5 } }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Stop Letting Multiplication Facts Be the Bottleneck
        </Typography>

        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
          If your child has to pause and calculate “7 × 8”… multiplication isn’t
          learned yet. Math Builders helps kids build reflex-level recall so the
          rest of math stops feeling like a fight.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          Why this matters
        </Typography>

        <Typography sx={{ mb: 2 }}>
          When facts aren’t automatic, your child’s brain has to spend attention
          on basics instead of solving the real problem. That pause shows up
          everywhere: multi-step word problems, long division, fractions,
          algebra, timed tests, and confidence.
        </Typography>

        <Box component="ul" sx={{ mt: 0, mb: 3, pl: 3 }}>
          {[
            'multi-step word problems',
            'long division',
            'fractions',
            'algebra',
            'mental math',
            'timed tests',
            'confidence',
          ].map((item) => (
            <li key={item}>
              <Typography>{item}</Typography>
            </li>
          ))}
        </Box>

        <Typography sx={{ mb: 3 }}>
          A lot of practice systems accidentally train the wrong skill: slow
          strategy-based answers (counting, skip-counting, fingers), repeating
          easy facts, and cramming. What you actually want is{' '}
          <b>automaticity</b>: accurate + fast + durable.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          The Math Builders Method: Automaticity by Design
        </Typography>

        <Typography sx={{ mb: 2 }}>
          Math Builders is a time-driven, adaptive practice system for mastering
          multiplication facts up to <b>24×24</b>, with complementary packs for{' '}
          <b>division</b>, <b>addition</b>, and <b>subtraction</b>. It’s not
          just flashcards—it’s an engine that schedules exactly what your child
          needs, when they need it.
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
              1) It adapts to both accuracy and speed
            </Typography>
            <Typography>
              Getting it right matters. But getting it right <b>fast</b> is the
              signal that recall is automatic. Fast correct answers progress
              faster. Slow correct answers don’t get a free pass. Incorrect
              answers come back sooner so gaps close quickly.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
              2) Hybrid spaced repetition (Leitner + SM-2)
            </Typography>
            <Typography>
              Math Builders combines clear mastery stages with smarter long-term
              spacing, using a priority-queue scheduler that surfaces what
              matters most—so your child gets maximum retention for the time
              they spend.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
              3) It avoids the “easy fact trap”
            </Typography>
            <Typography>
              Practice prioritizes due reviews first, then learning-phase facts,
              with controlled new fact introduction. That means steady progress
              without overwhelm—and without hiding weak spots.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
              4) Built for consistency (not willpower)
            </Typography>
            <Typography>
              Breakthroughs come from short, repeatable sessions that fit real
              life. Timed sessions, daily goals, and clear feedback help kids
              build momentum without constant nagging.
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          What you’ll notice when this clicks
        </Typography>

        <Typography sx={{ mb: 2 }}>
          When kids cross the line into real automaticity, families often
          notice:
        </Typography>

        <Box component="ul" sx={{ mt: 0, mb: 3, pl: 3 }}>
          {[
            'Less freezing and hesitation',
            'Less finger counting',
            'Faster homework',
            'Fewer careless mistakes',
            'Calmer test-taking',
            'Less avoidance and more confidence',
          ].map((item) => (
            <li key={item}>
              <Typography>{item}</Typography>
            </li>
          ))}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          Parents vs Teachers: who is this for?
        </Typography>

        <Typography sx={{ mb: 2 }}>
          <b>Parents</b> usually want homework to stop being a daily battle—and
          they want a strong foundation for future math.
          <br />
          <b>Teachers</b> usually want a system that targets practice
          automatically, closes gaps, and shows measurable progress with minimal
          overhead.
        </Typography>

        <Typography sx={{ mb: 3 }}>
          Math Builders supports both. In practice, many teams lead with parents
          first (clear, immediate pain point) and then package those wins into
          teacher-friendly workflows.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
          Frequently Asked Questions
        </Typography>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              What age/grade is this for?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              It’s ideal for learners who are ready for fact fluency—typically
              late elementary through middle school, plus older students (and
              adults) who are filling gaps.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              Is this “just memorization”?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Math Builders focuses on automatic recall of core facts. It
              complements conceptual instruction by removing the bottleneck that
              makes higher-level thinking harder.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              My child uses fingers/skip-counting. Is that bad?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Strategies can help early on, but long-term reliance keeps math
              slow and stressful. Math Builders helps kids transition from
              “figuring it out” to “just knowing it.”
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              How long does it take to see improvement?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Many families notice less hesitation within days of consistent
              practice. Stronger automaticity typically builds over weeks.
              Consistency beats cramming.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              How much should we practice per day?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Short, consistent sessions work best. Start small, make it daily,
              and let the system guide what to review.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              What if my child is behind or has big gaps?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              That’s one of the best use cases. The scheduler brings back missed
              facts more often, so gaps close without you guessing what to
              practice next.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              Will this overwhelm my child with too many facts?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              No. New facts are introduced in a controlled way, and reviews are
              prioritized so practice stays manageable.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              Can teachers use it with a class?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Yes. It works well for independent practice, homework,
              intervention, tutoring groups, and station time. If you’re a
              teacher and want classroom-specific workflows and reporting,
              that’s something we’re actively building toward.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              What makes Math Builders different from other flashcard apps?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Most apps track correctness. Math Builders tracks correctness{' '}
              <b>and</b> speed, then schedules reviews using a hybrid spaced
              repetition engine designed to build reflex recall—not just
              familiarity.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>
              What’s next beyond multiplication?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              In addition to multiplication packs, Math Builders supports
              complementary packs (division/addition/subtraction) and is
              designed to expand into additional high-value “core facts” over
              time.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Ready to make math feel lighter?
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Start small. Stay consistent. Let the system do the scheduling.
            </Typography>
          </Box>

          <Button size="large" variant="contained" onClick={handleTryItOut}>
            Start Training Now
          </Button>
        </Paper>
      </Paper>
    </Container>
  )
}
export default LearnMorePage
