import { type FC } from 'react'
import { Box, Typography, Stack, Tooltip } from '@mui/material'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

const ProfilePage: FC = () => {
  const { sessionLength, setSessionLength } = useSessionStatusContext()
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

      <Stack direction="row" spacing={2}>
        {[15, 30, 45].map((num) => (
          <Box
            key={num}
            onClick={() => setSessionLength(num)}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: sessionLength === num ? 'primary.main' : 'divider',
              cursor: 'pointer',
              bgcolor:
                sessionLength === num ? 'primary.light' : 'background.paper',
              color: sessionLength === num ? 'primary.contrastText' : 'inherit',
              transition: '0.2s',
              fontWeight: 600,
            }}
          >
            {num}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default ProfilePage
