import { useEffect, useMemo, useState, type FC } from 'react'
import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AppModal from '../AppModal/AppModal'
import type { GradeLevel, UserRole } from '../../constants/dataModels'
import { ROUTES } from '../../constants/routeConstants'
import { Link as RouterLink } from 'react-router-dom'

const ROLE_OPTIONS: Array<{
  value: UserRole
  label: string
  helper: string
}> = [
  {
    value: 'parent',
    label: 'Parent',
    helper: 'Track progress for one or more kids and keep them motivated.',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    helper: 'Support your class with data and differentiated practice.',
  },
  {
    value: 'student',
    label: 'Student',
    helper: 'Jump right into practice with fast, friendly sessions.',
  },
  {
    value: 'adult',
    label: 'Adult Learner',
    helper: 'Build speed and confidence with targeted practice.',
  },
]

const GRADE_OPTIONS: Array<{ value: GradeLevel; label: string }> = [
  { value: 'K', label: 'K' },
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' },
  { value: '5', label: '5th' },
  { value: '6', label: '6th' },
  { value: '7', label: '7th' },
  { value: '8', label: '8th' },
  { value: '9+', label: '9+' },
  { value: 'adult', label: 'Adult/Other' },
]

type OnboardingModalProps = {
  onComplete: (data: {
    role: UserRole
    gradeLevels: GradeLevel[]
    learnerCount: number | null
  }) => void
}

const OnboardingModal: FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<UserRole | null>(null)
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [learnerCount, setLearnerCount] = useState<string>('1')

  const isMultiLearner = role === 'parent' || role === 'teacher'

  useEffect(() => {
    setGradeLevels([])
    setLearnerCount('1')
  }, [role])

  const defaultPackLabel = useMemo(() => {
    if (gradeLevels.some((grade) => ['K', '1', '2'].includes(grade))) {
      return 'Addition within 20'
    }
    return 'Multiplication to 36'
  }, [gradeLevels])

  const toggleGrade = (grade: GradeLevel) => {
    if (isMultiLearner) {
      setGradeLevels((prev) =>
        prev.includes(grade)
          ? prev.filter((g) => g !== grade)
          : [...prev, grade]
      )
      return
    }
    setGradeLevels([grade])
  }

  const canContinueRole = Boolean(role)
  const canContinueGrades = gradeLevels.length > 0

  const parsedLearnerCount = Number.parseInt(learnerCount, 10)
  const learnerCountValue =
    isMultiLearner && Number.isFinite(parsedLearnerCount)
      ? Math.max(1, parsedLearnerCount)
      : null

  const handleComplete = () => {
    if (!role || gradeLevels.length === 0) return
    onComplete({
      role,
      gradeLevels,
      learnerCount: learnerCountValue,
    })
  }

  return (
    <AppModal
      open
      onClose={() => null}
      title="Welcome to Multiplication Masters"
      maxWidth="sm"
      disableClose
      hideCloseButton
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Step {step + 1} of 3
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {step === 0
              ? 'Tell us who you are'
              : step === 1
                ? 'Which grade levels are you supporting?'
                : 'We will personalize your first session'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step === 0
              ? 'This helps us tailor practice and highlight the right wins.'
              : step === 1
                ? 'Select all that apply so we can set the right starting pack.'
                : 'You can always adjust packs and settings later in Profile.'}
          </Typography>
        </Box>

        {step === 0 && (
          <Stack spacing={1.5}>
            {ROLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={role === option.value ? 'contained' : 'outlined'}
                onClick={() => setRole(option.value)}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                }}
              >
                <Box textAlign="left">
                  <Typography sx={{ fontWeight: 700 }}>
                    {option.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.helper}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(3, minmax(0, 1fr))',
                  sm: 'repeat(6, minmax(0, 1fr))',
                },
                gap: 1,
              }}
            >
              {GRADE_OPTIONS.map((option) => {
                const selected = gradeLevels.includes(option.value)
                return (
                  <Button
                    key={option.value}
                    variant={selected ? 'contained' : 'outlined'}
                    onClick={() => toggleGrade(option.value)}
                    sx={{
                      minWidth: 0,
                      px: 0,
                      py: 1,
                      fontWeight: 700,
                    }}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </Box>

            {isMultiLearner && (
              <TextField
                label="Number of learners"
                type="number"
                value={learnerCount}
                onChange={(event) => setLearnerCount(event.target.value)}
                inputProps={{ min: 1, max: 25 }}
              />
            )}
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Starting pack
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We will start with {defaultPackLabel} based on the grades you
                selected.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Other packs are available after upgrade.
              </Typography>
            </Box>

            {role === 'student' ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Want more practice packs?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask a parent or teacher to unlock packs up to 576, division,
                  and subtraction.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Keep them motivated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upgrading unlocks packs up to 576, division, and subtraction,
                  plus deeper progress insights to keep learners on track.
                </Typography>
              </Box>
            )}

            <Divider />

            <Typography variant="body2" color="text.secondary">
              You can manage packs, goals, and tour settings anytime in{' '}
              <Button
                component={RouterLink}
                to={ROUTES.PROFILE}
                size="small"
                sx={{ textTransform: 'none', px: 0.5 }}
              >
                Profile
              </Button>
              .
            </Typography>
          </Stack>
        )}

        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button
            variant="text"
            disabled={step === 0}
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button
              variant="contained"
              onClick={() => setStep((prev) => prev + 1)}
              disabled={step === 0 ? !canContinueRole : !canContinueGrades}
            >
              Continue
            </Button>
          ) : (
            <Button variant="contained" onClick={handleComplete}>
              Start Session
            </Button>
          )}
        </Box>
      </Stack>
    </AppModal>
  )
}

export default OnboardingModal
