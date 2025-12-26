import { type FC } from 'react'
import {
  Box,
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

const ProfilePage: FC = () => {
  const { sessionLength, setSessionLength } = useSessionStatusContext()
  const isMobile = useIsMobile()
  const { mode, setMode } = useThemeContext()

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

        // Card visuals only on desktop
        borderRadius: { xs: 0, sm: 2 },
        border: { xs: 'none', sm: '1px solid' },
        borderColor: 'divider',
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
      }}
    >
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
          <Typography variant="caption" color="text.secondary">
            Choose a session size. <strong>Daily</strong> is recommended.
            <br />
            <br />
            For difficult tables (like 4s, 6s, 7s), choose{' '}
            <strong>Light</strong> or <strong>Quick</strong> to limit new cards.
            <br />
            <br />
            (1 new card ≈ 3 reviews)
          </Typography>
        ) : (
          <Tooltip
            arrow
            placement="right"
            title={
              <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
                Choose a session size. <strong>Daily</strong> is recommended.
                <br />
                <br />
                For difficult tables (like 4s, 6s, 7s), choose{' '}
                <strong>Light</strong> or <strong>Quick</strong> to limit new
                cards.
                <br />
                <br />
                (1 new card ≈ 3 reviews)
              </Typography>
            }
          >
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
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
          },
          gap: 1,
        }}
      >
        {[
          { value: 10, label: 'Quick', reviews: 'about 30' },
          { value: 20, label: 'Light', reviews: 'about 60' },
          { value: 30, label: 'Daily', reviews: 'about 90' },
          { value: 45, label: 'Intense', reviews: 'about 135' },
        ].map((option) => {
          const selected = sessionLength === option.value

          return (
            <Box
              component="button"
              type="button"
              key={option.value}
              onClick={() => setSessionLength(option.value)}
              onKeyDown={handleChoiceKeyDown}
              aria-label={`Set session to ${option.label}`}
              aria-pressed={selected}
              sx={{
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
