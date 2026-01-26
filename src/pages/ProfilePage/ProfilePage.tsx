import { type FC } from 'react'
import {
  Box,
  Button,
  Typography,
  Tooltip,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useThemeContext } from '../../contexts/themeContext/themeContext'
import {
  DEFAULT_SESSION_LENGTH,
  MAX_NEW_CARDS_PER_DAY,
  NEW_CARDS_PER_DAY_OPTIONS,
} from '../../constants/appConstants'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import SaveProgressModal from '../../components/Login/SaveProgressModal'
import { useModal } from '../../contexts/modalContext/modalContext'
import SavedScenesGallery from '../../components/SavedScenesGallery/SavedScenesGallery'

const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, 1fr)',
    sm: 'repeat(4, 1fr)',
  },
  gap: 1,
}

const optionButtonStyle = (selected: boolean) => ({
  all: 'unset',
  px: 1,
  py: 1.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: selected ? 'primary.main' : 'divider',
  cursor: 'pointer',
  bgcolor: selected ? 'primary.light' : 'background.paper',
  color: selected ? 'primary.contrastText' : 'inherit',
  transition: '0.2s',
  fontWeight: 600,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 56,
  height: '100%',

  '&:hover': {
    borderColor: selected ? 'primary.main' : 'text.primary',
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
})

const getNewCardText = (isTooltip: boolean) => (
  <Typography
    variant="caption"
    color={isTooltip ? 'inherit' : 'text.secondary'}
  >
    This limits how many <strong>brand new</strong> facts you see each day.
    <br />
    <br />
    For example, if you choose{' '}
    <strong>{`${NEW_CARDS_PER_DAY_OPTIONS[0]}`}</strong>, you will only learn{' '}
    {`${NEW_CARDS_PER_DAY_OPTIONS[0]}`} new facts today. The rest of your
    practice will be on facts you already know.
  </Typography>
)

const getSessionText = (isTooltip: boolean) => (
  <Typography
    variant="caption"
    color={isTooltip ? 'inherit' : 'text.secondary'}
  >
    Choose a session size. <strong>Daily</strong> is recommended.
    <br />
    <br />
    For difficult tables (like 4s, 6s, 7s), choose <strong>
      Light
    </strong> or <strong>Quick</strong> to limit new cards.
    <br />
    <br />
    (1 new card ≈ 3 reviews)
  </Typography>
)

const ProfilePage: FC = () => {
  const { sessionLength } = useSessionStatusContext()
  const isMobile = useIsMobile()
  const { mode, setMode } = useThemeContext()
  const { user, updateUser } = useUser()
  const { auth } = useFirebaseContext()
  const { openModal, closeModal } = useModal()

  const isAnonymous = auth?.currentUser?.isAnonymous

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as 'light' | 'dark' | 'system')
  }

  const handleChoiceKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        m: { xs: 1, sm: 2 },
        mb: { xs: 4, sm: 'inherit' },

        // Card visuals only on desktop
        borderRadius: { xs: 0, sm: 2 },
        border: { xs: 'none', sm: '1px solid' },
        borderColor: 'divider',
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
      }}
    >
      {/* Profile Title */}
      <Typography
        variant="h2"
        sx={{
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '2rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        {user?.username ?? 'Student Profile'}
      </Typography>
      {isAnonymous && (
        <Button
          variant="outlined"
          color="warning"
          onClick={() => {
            openModal(<SaveProgressModal onClose={closeModal} />)
          }}
          sx={{ mb: 3 }}
        >
          Save Progress (Sign Up)
        </Button>
      )}
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 0.5,
          mb: 1,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Typography variant="subtitle2">Session Intensity</Typography>

        {isMobile ? (
          getSessionText(false)
        ) : (
          <Tooltip arrow placement="right" title={getSessionText(true)}>
            <InfoOutlinedIcon
              sx={{
                fontSize: 16,
                color: 'text.secondary',
                cursor: 'help',
              }}
            />
          </Tooltip>
        )}
      </Box>
      {/* Choices */}
      <Box role="group" aria-label="Session Intensity" sx={gridContainerStyle}>
        {[
          { value: 10, label: 'Quick', reviews: 'about 30' },
          {
            value: DEFAULT_SESSION_LENGTH,
            label: 'Light',
            reviews: 'about 60',
          },
          { value: 30, label: 'Daily', reviews: 'about 90' },
          { value: 45, label: 'Intense', reviews: 'about 135' },
        ].map((option) => {
          const selected = sessionLength === option.value

          return (
            <Box
              component="button"
              type="button"
              key={option.label}
              onClick={() =>
                updateUser({ userDefaultSessionLength: option.value })
              }
              onKeyDown={handleChoiceKeyDown}
              aria-label={`Set session to ${option.label}`}
              aria-pressed={selected}
              sx={optionButtonStyle(selected)}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
              >
                {option.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.8, fontSize: '0.7rem' }}
              >
                {option.reviews} reviews
              </Typography>
            </Box>
          )
        })}
      </Box>
      {/* New Cards Per Day */}
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 0.5,
            mb: 1,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Typography variant="subtitle2">New Cards per Day</Typography>

          {isMobile ? (
            getNewCardText(false)
          ) : (
            <Tooltip arrow placement="right" title={getNewCardText(true)}>
              <InfoOutlinedIcon
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  cursor: 'help',
                }}
              />
            </Tooltip>
          )}
        </Box>

        <Box
          role="group"
          aria-label="New Cards Per Day"
          sx={gridContainerStyle}
        >
          {[
            {
              value: NEW_CARDS_PER_DAY_OPTIONS[0],
              label: `${NEW_CARDS_PER_DAY_OPTIONS[0]} Gentle`,
              desc: 'Low-friction',
            },
            {
              value: NEW_CARDS_PER_DAY_OPTIONS[1],
              label: `${NEW_CARDS_PER_DAY_OPTIONS[1]} Standard`,
              desc: 'Recommended',
            },
            {
              value: NEW_CARDS_PER_DAY_OPTIONS[2],
              label: `${NEW_CARDS_PER_DAY_OPTIONS[2]} Difficult`,
              desc: 'More challenging',
            },
            {
              value: NEW_CARDS_PER_DAY_OPTIONS[3],
              label: `${NEW_CARDS_PER_DAY_OPTIONS[3]} Aggressive`,
              desc: 'Motivated users',
            },
          ].map((option) => {
            const selected =
              (user?.maxNewCardsPerDay ?? MAX_NEW_CARDS_PER_DAY) ===
              option.value
            return (
              <Box
                component="button"
                type="button"
                key={option.value}
                onClick={() => updateUser({ maxNewCardsPerDay: option.value })}
                onKeyDown={handleChoiceKeyDown}
                aria-label={`Set new cards limit to ${option.label}`}
                aria-pressed={selected}
                sx={optionButtonStyle(selected)}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, lineHeight: 1.2 }}
                >
                  {option.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, fontSize: '0.7rem', mt: 0.5 }}
                >
                  {option.desc}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Saved Scenes */}
      <SavedScenesGallery />

      {/* Theme Preference */}
      <Box sx={{ mt: 4 }}>
        <Typography id="appearance-label" variant="subtitle2" sx={{ mb: 1 }}>
          Appearance
        </Typography>
        <FormControl>
          <RadioGroup
            row
            aria-labelledby="appearance-label"
            name="theme-preference"
            value={mode}
            onChange={handleThemeChange}
          >
            <FormControlLabel value="light" control={<Radio />} label="Light" />
            <FormControlLabel value="dark" control={<Radio />} label="Dark" />
            <FormControlLabel
              value="system"
              control={<Radio />}
              label="System"
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  )
}

export default ProfilePage
