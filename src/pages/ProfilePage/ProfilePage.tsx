import { type FC } from 'react'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box,
  type BoxProps,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  type SelectChangeEvent,
  Tooltip,
  Typography,
} from '@mui/material'

import SaveProgressModal from '../../components/Login/SaveProgressModal'
import SetPinModal from '../../components/Login/SetPinModal'
import SavedScenesGallery from '../../components/SavedScenesGallery/SavedScenesGallery'
import {
  DEFAULT_SESSION_LENGTH,
  MAX_NEW_CARDS_PER_DAY,
  NEW_CARDS_PER_DAY_OPTIONS,
} from '../../constants/appConstants'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useModal } from '../../contexts/modalContext/modalContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useThemeContext } from '../../contexts/themeContext/themeContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { PackKey } from '../../constants/dataModels'
import SceneThemeSelect from '../../components/SceneThemeSelect/SceneThemeSelect'

/**
 * Style object for the grid container used in the profile page.
 */
const GRID_CONTAINER_STYLE = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, 1fr)',
    sm: 'repeat(4, 1fr)',
  },
  gap: 1,
}

/**
 * Returns the styles for an option button based on its selection state.
 *
 * @param selected - Whether the option is currently selected.
 * @returns The style object for the button.
 */
const getOptionButtonStyle = (selected: boolean): BoxProps['sx'] => ({
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

/**
 * Returns the descriptive text for the new cards per day setting.
 *
 * @param isTooltip - Whether the text is being displayed in a tooltip.
 * @returns The rendered typography component.
 */
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

/**
 * Returns the descriptive text for the session intensity setting.
 *
 * @param isTooltip - Whether the text is being displayed in a tooltip.
 * @returns The rendered typography component.
 */
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

/**
 * Mapping of pack IDs to their display labels.
 */
const PACK_LABELS: Partial<Record<PackKey, string>> = {
  mul_144: 'Multiplication to 144',
  mul_36: 'Multiplication to 36',
  mul_576: 'Multiplication to 576',
  div_144: 'Division 144',
  add_20: 'Addition to 20',
  sub_20: 'Subtraction within 20',
}

/**
 * Component for the user profile page, allowing users to manage their session settings,
 * theme preferences, and active learning packs.
 *
 * @returns The rendered ProfilePage component.
 */
const ProfilePage: FC = () => {
  const { auth } = useFirebaseContext()
  const { openModal, closeModal } = useModal()
  const isMobile = useIsMobile()
  const { mode, setMode } = useThemeContext()
  const { sessionLength } = useSessionStatusContext()
  const { updateUser, user } = useUser()

  const handleChoiceKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  const handlePackChange = (event: SelectChangeEvent<PackKey>) => {
    updateUser({ activePack: event.target.value })
  }

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as 'light' | 'dark' | 'system')
  }

  const isAnonymous = auth?.currentUser?.isAnonymous
  const providerIds =
    auth?.currentUser?.providerData?.map((p) => p.providerId) || []
  const canEnablePinSignIn =
    Boolean(auth?.currentUser) &&
    !isAnonymous &&
    (providerIds.includes('google.com') || providerIds.includes('password'))

  const hasPinSignIn = Boolean(user?.hasUsernamePin)

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

      {canEnablePinSignIn && !hasPinSignIn ? (
        <Button
          variant="outlined"
          onClick={() => openModal(<SetPinModal onClose={closeModal} />)}
          sx={{ mb: 2 }}
        >
          Enable Username + PIN sign-in
        </Button>
      ) : null}

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
      <Box
        role="group"
        aria-label="Session Intensity"
        sx={GRID_CONTAINER_STYLE}
      >
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
              component="div"
              role="button"
              tabIndex={0}
              key={option.label}
              onClick={() =>
                updateUser({ userDefaultSessionLength: option.value })
              }
              onKeyDown={handleChoiceKeyDown}
              aria-label={`Set session to ${option.label}`}
              aria-pressed={selected}
              sx={getOptionButtonStyle(selected)}
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
          sx={GRID_CONTAINER_STYLE}
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
                component="div"
                role="button"
                tabIndex={0}
                key={option.value}
                onClick={() => updateUser({ maxNewCardsPerDay: option.value })}
                onKeyDown={handleChoiceKeyDown}
                aria-label={`Set new cards limit to ${option.label}`}
                aria-pressed={selected}
                sx={getOptionButtonStyle(selected)}
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

      {/* Active Fact Pack */}
      <Box sx={{ mt: 4 }}>
        <Typography sx={{ mb: 1 }} variant="subtitle2">
          Active Fact Pack
        </Typography>
        <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
          <InputLabel id="active-pack-label">Select Fact Pack</InputLabel>
          <Select
            label="Select Fact Pack"
            labelId="active-pack-label"
            onChange={handlePackChange}
            value={user?.activePack || ''}
          >
            {(user?.enabledPacks || []).map((packId: PackKey) => {
              return (
                <MenuItem key={packId} value={packId}>
                  {PACK_LABELS[packId] || packId}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </Box>

      {/* Active Scene Select */}
      <SceneThemeSelect
        getOptionButtonStyle={getOptionButtonStyle}
        handleChoiceKeyDown={handleChoiceKeyDown}
      />

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
