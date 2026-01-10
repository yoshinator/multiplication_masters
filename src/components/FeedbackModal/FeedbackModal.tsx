import { useEffect, useMemo, useState, type FC } from 'react'
import {
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
} from '@mui/material'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useLocation } from 'react-router-dom'
import AppModal from '../AppModal/AppModal'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { useLogger } from '../../hooks/useLogger'
import { extractErrorMessage } from '../../utilities/typeutils'

type FeedbackType = 'bug' | 'confusing' | 'feature' | 'pricing' | 'other'

const MARKET_SURVEY_URL = 'https://forms.gle/XEv8k36TtKS4nFqK7'
const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'confusing', label: 'Confusing' },
  { value: 'feature', label: 'Feature request' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'other', label: 'Other' },
]

// Best-effort build string (works without extra env config)
const getBuildString = () => {
  const v = import.meta.env.VITE_APP_VERSION
  const sha = import.meta.env.VITE_GIT_SHA
  if (v && sha) return `${String(v)}+${String(sha)}`
  if (v) return String(v)
  if (sha) return String(sha)
  return import.meta.env.DEV ? 'dev' : 'prod'
}

type FeedbackModalProps = {
  onClose: () => void
}

const FeedbackModal: FC<FeedbackModalProps> = ({ onClose }) => {
  const [type, setType] = useState<FeedbackType>('bug')
  const logger = useLogger('FeedbackModal')

  // Guided fields
  const [summary, setSummary] = useState('')
  const [details, setDetails] = useState('')

  // Bug-specific
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')

  // Contact
  const [canContact, setCanContact] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { showNotification } = useNotification()
  const location = useLocation()

  // Prefill email when modal opens (if available)
  useEffect(() => {
    if (!open) return
    const auth = getAuth()
    const user = auth.currentUser
    const candidate = user?.email ?? ''
    setEmail((prev) => prev || candidate)
  }, [])

  const prompt = useMemo(() => {
    switch (type) {
      case 'bug':
        return {
          summaryLabel: 'What went wrong? (short)',
          detailsLabel: 'More details',
        }
      case 'confusing':
        return {
          summaryLabel: 'Where did you get stuck? (short)',
          detailsLabel: 'What was confusing?',
        }
      case 'feature':
        return {
          summaryLabel: 'What are you trying to do? (short)',
          detailsLabel: 'Describe the feature you want',
        }
      case 'pricing':
        return {
          summaryLabel: 'Pricing thoughts (short)',
          detailsLabel: 'Anything else you want to share?',
        }
      default:
        return {
          summaryLabel: 'Summary (short)',
          detailsLabel: 'Details',
        }
    }
  }, [type])

  const resetForm = () => {
    setType('bug')
    setSummary('')
    setDetails('')
    setStepsToReproduce('')
    setExpected('')
    setActual('')
    setCanContact(false)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const validate = () => {
    if (!summary.trim()) return 'Please enter a short summary.'
    if (canContact && !email.trim())
      return 'Please enter your email (or uncheck follow-up).'
    // Light bug-specific nudge (not required)
    if (type === 'bug' && !details.trim() && !stepsToReproduce.trim()) {
      return 'For bugs, add details or steps to reproduce.'
    }
    return null
  }

  const handleSubmit = async () => {
    const errorMsg = validate()
    if (errorMsg) {
      showNotification(errorMsg, 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const auth = getAuth()
      const user = auth.currentUser
      const db = getFirestore()

      const isAnonymous = user?.isAnonymous ?? true
      const providers = isAnonymous
        ? ['anonymous']
        : (user?.providerData?.map((p) => p.providerId).filter(Boolean) ?? [])

      const feedbackData = {
        uid: user?.uid ?? 'anonymous',

        // category + structured content
        type,
        summary: summary.trim(),
        details: details.trim() || null,
        stepsToReproduce:
          type === 'bug' ? stepsToReproduce.trim() || null : null,
        expected: type === 'bug' ? expected.trim() || null : null,
        actual: type === 'bug' ? actual.trim() || null : null,

        // contact
        canContact,
        contactEmail: canContact ? email.trim() : null,

        // timestamps
        createdAt: serverTimestamp(),

        // context
        route: location.pathname,
        build: getBuildString(),
        env: import.meta.env.DEV ? 'dev' : 'prod',
        viewport: { w: window.innerWidth, h: window.innerHeight },
        userAgent: navigator.userAgent,
        locale: navigator.language,

        isAnonymous,
        providers,
      }

      await addDoc(collection(db, 'feedback'), feedbackData)

      showNotification('Feedback sent. Thank you!', 'success')
      handleClose()
    } catch (error) {
      logger('Error submitting feedback: ' + extractErrorMessage(error))
      showNotification('Failed to submit feedback. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSend =
    summary.trim().length > 0 && (!canContact || email.trim().length > 0)

  return (
    <AppModal open onClose={handleClose} title="Send Feedback" maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          select
          label="Category"
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          fullWidth
        >
          {FEEDBACK_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Help shape MathBuilders (90-second survey)
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            This is for pricing + market fit (not bug reports). Totally
            optional.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              sx={{
                borderRadius: 0.5,
                textTransform: 'none',
              }}
              onClick={() =>
                window.open(MARKET_SURVEY_URL, '_blank', 'noopener')
              }
            >
              Take the survey
            </Button>
          </Box>
        </Box>

        <TextField
          label={prompt.summaryLabel}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One sentence is perfect."
          fullWidth
          required
          slotProps={{ htmlInput: { maxLength: 140 } }}
          helperText={`${summary.length}/140`}
        />

        <TextField
          label={prompt.detailsLabel}
          multiline
          minRows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Add any context that would help."
          fullWidth
          slotProps={{ htmlInput: { maxLength: 4000 } }}
          helperText={`${summary.length}/4000`}
        />

        {type === 'bug' && (
          <>
            <Divider />
            <Typography variant="subtitle2">Bug details</Typography>

            <TextField
              label="Steps to reproduce"
              multiline
              minRows={2}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder={'1) ...\n2) ...\n3) ...'}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 4000 } }}
            />

            <TextField
              label="Expected"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="What should have happened?"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 4000 } }}
            />

            <TextField
              label="Actual"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="What actually happened?"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 4000 } }}
            />
          </>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={canContact}
              onChange={(e) => setCanContact(e.target.checked)}
            />
          }
          label="Can we contact you for follow-up?"
        />

        {canContact && (
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            placeholder="your@email.com"
            required
          />
        )}

        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}
        >
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSend}
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      </Box>
    </AppModal>
  )
}

export default FeedbackModal
