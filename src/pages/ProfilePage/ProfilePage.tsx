import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
  Switch,
  TextField,
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
import type { PackKey, UserProfile } from '../../constants/dataModels'
import SceneThemeSelect from '../../components/SceneThemeSelect/SceneThemeSelect'
import { useFirestoreQuery } from '../../hooks/useFirestore'
import { collection, query } from 'firebase/firestore'
import { useCloudFunction } from '../../hooks/useCloudFunction'

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

const PROFILE_GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
  { value: 6, label: '6th' },
  { value: 7, label: '7th' },
  { value: 8, label: '8th' },
  { value: 9, label: '9th' },
  { value: 10, label: '10th' },
  { value: 11, label: '11th' },
  { value: 12, label: '12th' },
]

const formatProfileGrade = (grade: number | null | undefined) => {
  if (grade === null || grade === undefined) return 'Not set'
  const match = PROFILE_GRADE_OPTIONS.find((option) => option.value === grade)
  return match?.label ?? `Grade ${grade}`
}

/**
 * Component for the user profile page, allowing users to manage their session settings,
 * theme preferences, and active learning packs.
 *
 * @returns The rendered ProfilePage component.
 */
const ProfilePage: FC = () => {
  const { auth, db } = useFirebaseContext()
  const { openModal, closeModal } = useModal()
  const isMobile = useIsMobile()
  const { mode, setMode } = useThemeContext()
  const { sessionLength } = useSessionStatusContext()
  const { updateUser, user, profile, activeProfileId, setActiveProfileId } =
    useUser()

  const [profileSessionId, setProfileSessionId] = useState<string | null>(null)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileGrade, setNewProfileGrade] = useState('')

  const { execute: createProfileFn, isPending: isCreatingProfile } =
    useCloudFunction<
      { displayName: string; gradeLevel: number | null },
      { profileId: string; loginName: string; displayName: string }
    >('createProfile')

  useEffect(() => {
    if (!auth?.currentUser) {
      setProfileSessionId(null)
      return
    }

    auth.currentUser
      .getIdTokenResult()
      .then((result) => {
        const claim = result.claims.profileId
        setProfileSessionId(typeof claim === 'string' ? claim : null)
      })
      .catch(() => setProfileSessionId(null))
  }, [auth?.currentUser])

  const isProfileSession = Boolean(profileSessionId)

  const profilesQuery = useMemo(() => {
    if (!db || !user?.uid || isProfileSession) return null
    return query(collection(db, 'users', user.uid, 'profiles'))
  }, [db, user?.uid, isProfileSession])

  const { data: profiles } = useFirestoreQuery<UserProfile>(profilesQuery)

  const canCreateProfile =
    newProfileName.trim().length > 0 && !isCreatingProfile

  const handleCreateProfile = async () => {
    if (!canCreateProfile) return
    const gradeLevel = newProfileGrade
      ? Number.parseInt(newProfileGrade, 10)
      : null
    const result = await createProfileFn({
      displayName: newProfileName.trim(),
      gradeLevel,
    })
    const profileId = result?.data?.profileId
    if (profileId) {
      await setActiveProfileId(profileId)
    }
    setNewProfileName('')
    setNewProfileGrade('')
  }

  const handleChoiceKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  const handlePackChange = (event: SelectChangeEvent<PackKey>) => {
    updateUser({ activePack: event.target.value })
  }

  const handleThemeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as 'light' | 'dark' | 'system')
  }

  const handleShowTourChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateUser({ showTour: event.target.checked })
  }

  const isAnonymous = auth?.currentUser?.isAnonymous
  const providerIds =
    auth?.currentUser?.providerData?.map((p) => p.providerId) || []
  const canEnablePinSignIn =
    Boolean(auth?.currentUser) &&
    !isAnonymous &&
    (providerIds.includes('google.com') || providerIds.includes('password'))

  const hasPinSignIn = Boolean(profile?.pinEnabled)
  const canManageProfiles = !isProfileSession

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
        {profile?.displayName ?? user?.username ?? 'Student Profile'}
      </Typography>

      {canManageProfiles && canEnablePinSignIn && !hasPinSignIn ? (
        <Button
          variant="outlined"
          onClick={() => openModal(<SetPinModal onClose={closeModal} />)}
          sx={{ mb: 2 }}
        >
          Enable profile PIN sign-in
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
      {canManageProfiles ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Learner Profiles
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <Box
              role="group"
              aria-label="Learner profiles"
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 1.5,
              }}
            >
              {profiles.map((profileItem) => {
                const selected = activeProfileId === profileItem.id
                return (
                  <Box
                    key={profileItem.id}
                    component="button"
                    type="button"
                    onClick={() => setActiveProfileId(profileItem.id)}
                    sx={{
                      textAlign: 'left',
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? 'primary.light' : 'background.paper',
                      color: selected ? 'primary.contrastText' : 'inherit',
                      display: 'grid',
                      gap: 0.5,
                      transition: '0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: selected ? 'primary.main' : 'text.primary',
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {profileItem.displayName}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                      {formatProfileGrade(profileItem.gradeLevel)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Sign-in: {profileItem.loginName}
                    </Typography>
                  </Box>
                )
              })}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: { xs: 'transparent', sm: 'background.default' },
              }}
            >
              <Typography variant="subtitle2">Add learner</Typography>
              <TextField
                label="Display name"
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
                placeholder="e.g., Mia"
                size="small"
              />
              <FormControl size="small">
                <InputLabel id="new-profile-grade-label">Grade</InputLabel>
                <Select
                  labelId="new-profile-grade-label"
                  label="Grade"
                  value={newProfileGrade}
                  onChange={(event: SelectChangeEvent<string>) => {
                    setNewProfileGrade(event.target.value)
                  }}
                >
                  <MenuItem value="">Not set</MenuItem>
                  {PROFILE_GRADE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={handleCreateProfile}
                disabled={!canCreateProfile}
              >
                {isCreatingProfile ? 'Creating...' : 'Create profile'}
              </Button>
              <Typography variant="caption" color="text.secondary">
                Sign-in names must be unique and are generated from the display
                name.
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : null}

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

      {/* Guided Tour */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Guided Tour
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(user?.showTour)}
              onChange={handleShowTourChange}
            />
          }
          label="Show the tour next time I visit Practice"
        />
      </Box>
    </Box>
  )
}

export default ProfilePage
