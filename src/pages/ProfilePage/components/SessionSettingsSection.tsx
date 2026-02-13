import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Tooltip, Typography } from '@mui/material'
import type { FC, KeyboardEvent } from 'react'
import {
  DEFAULT_SESSION_LENGTH,
  MAX_NEW_CARDS_PER_DAY,
  NEW_CARDS_PER_DAY_OPTIONS,
} from '../../../constants/appConstants'
import ProfileSectionCard from './ProfileSectionCard'
import {
  getProfileOptionButtonStyle,
  PROFILE_OPTION_GRID_STYLE,
} from './profileUi'

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
    For difficult tables (like 4s, 6s, 7s), choose <strong>Light</strong> or{' '}
    <strong>Quick</strong> to limit new cards.
    <br />
    <br />
    (1 new card ≈ 3 reviews)
  </Typography>
)

type SessionSettingsSectionProps = {
  isMobile: boolean
  sessionLength: number
  maxNewCardsPerDay: number
  onChoiceKeyDown: (e: KeyboardEvent<HTMLElement>) => void
  onSessionLengthChange: (value: number) => void
  onMaxNewCardsChange: (value: number) => void
}

const SessionSettingsSection: FC<SessionSettingsSectionProps> = ({
  isMobile,
  sessionLength,
  maxNewCardsPerDay,
  onChoiceKeyDown,
  onSessionLengthChange,
  onMaxNewCardsChange,
}) => {
  return (
    <ProfileSectionCard>
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

      <Box role="group" aria-label="Session Intensity" sx={PROFILE_OPTION_GRID_STYLE}>
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
              onClick={() => onSessionLengthChange(option.value)}
              onKeyDown={onChoiceKeyDown}
              aria-label={`Set session to ${option.label}`}
              aria-pressed={selected}
              sx={getProfileOptionButtonStyle(selected)}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {option.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                {option.reviews} reviews
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Box sx={{ mt: 3 }}>
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
          sx={PROFILE_OPTION_GRID_STYLE}
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
              (maxNewCardsPerDay ?? MAX_NEW_CARDS_PER_DAY) === option.value
            return (
              <Box
                component="div"
                role="button"
                tabIndex={0}
                key={option.value}
                onClick={() => onMaxNewCardsChange(option.value)}
                onKeyDown={onChoiceKeyDown}
                aria-label={`Set new cards limit to ${option.label}`}
                aria-pressed={selected}
                sx={getProfileOptionButtonStyle(selected)}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
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
    </ProfileSectionCard>
  )
}

export default SessionSettingsSection
