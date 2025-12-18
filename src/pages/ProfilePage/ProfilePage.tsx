import { type FC } from 'react'
import { Box, Typography, Stack, Tooltip } from '@mui/material'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

const ProfilePage: FC = () => {
  const { sessionLength, setSessionLength } = useSessionStatusContext()

  const handleChoiceKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Make Enter/Space activate consistently and prevent page scroll on Space.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        my: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="subtitle2">Cards per Session</Typography>

        <Tooltip
          arrow
          placement="right"
          title={
            <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
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
      </Box>

      <Stack
        direction="row"
        spacing={2}
        role="group"
        aria-label="Cards per session"
      >
        {[15, 30, 45].map((num) => {
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
                // reset default button styles
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
      </Stack>
    </Box>
  )
}

export default ProfilePage
