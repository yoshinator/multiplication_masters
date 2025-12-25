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
        <Typography variant="subtitle2">Cards per Session</Typography>

        {isMobile ? (
          <Typography variant="caption" color="text.secondary">
            You choose a minimum session size (15, 30, or 45).
            <br />
            <br />
            The system may add more questions during the session to reinforce
            new or difficult cards.
            <br />
            <br />
            For example, choosing 15 can result in about 45 total questions if
            many cards are new.
            <br />
            <br />
            This is intentional and helps build fast, long-term recall.
          </Typography>
        ) : (
          <Tooltip
            arrow
            placement="right"
            title={
              <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
                You choose a minimum session size (15, 30, or 45).
                <br />
                <br />
                The system may add more questions during the session to
                reinforce new or difficult cards.
                <br />
                <br />
                For example, choosing 15 can result in about 45 total questions
                if many cards are new.
                <br />
                <br />
                This is intentional and helps build fast, long-term recall.
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
        aria-label="Cards per session"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
          },
          gap: 1,
        }}
      >
        {[10, 15, 30, 45].map((num) => {
          const selected = sessionLength === num

          return (
            <Box
              component="button"
              type="button"
              key={num}
              onClick={() => setSessionLength(num)}
              onKeyDown={handleChoiceKeyDown}
              aria-label={`Set cards per session to ${num}`}
              aria-pressed={selected}
              sx={{
                all: 'unset',
                px: 2,
                py: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                cursor: 'pointer',
                bgcolor: selected ? 'primary.light' : 'background.paper',
                color: selected ? 'primary.contrastText' : 'inherit',
                transition: '0.2s',
                fontWeight: 600,
                textAlign: 'center',
                display: 'inline-flex',
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
              {num}
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
