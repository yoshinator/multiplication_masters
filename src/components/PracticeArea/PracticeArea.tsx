import { useState, type FC } from 'react'
import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Divider,
  Button,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import CloseIcon from '@mui/icons-material/Close'
import TimerContextProvider from '../../contexts/timer/TimerProvider'
import MultiplicationCard from '../MultiplicationCard/MultiplicationCard'
import StatsPanel from '../StatsPanel/StatsPanel'
import LevelPanel from '../LevelPanel/LevelPanel'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'

const PracticeArea: FC = () => {
  const [sessionLength, setSessionLength] = useState<number>(30)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const { isMastered } = useReviewSession()
  const { startSession } = useCardSchedulerContext()
  const { isSessionActive } = useSessionStatusContext()

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* TOP HUD: Level + Stats */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="flex-start" // 💡 Changed from 'center' to 'flex-start' for cleaner vertical alignment
        sx={{ mb: 2, justifyContent: 'space-between' }}
      >
        <LevelPanel isMastered={isMastered} />

        {/* StatsPanel sits next to LevelPanel */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <StatsPanel compact />
          {/* Settings button */}
          <Tooltip title="Session Settings">
            <IconButton
              onClick={() => setSettingsOpen(!settingsOpen)}
              color="primary"
            >
              {settingsOpen ? <CloseIcon /> : <SettingsIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
      {/* Collapsible session settings */}
      <Collapse in={settingsOpen}>
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Cards per Session
          </Typography>

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
                  borderColor:
                    sessionLength === num ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  bgcolor:
                    sessionLength === num
                      ? 'primary.light'
                      : 'background.paper',
                  color:
                    sessionLength === num ? 'primary.contrastText' : 'inherit',
                  transition: '0.2s',
                  fontWeight: 600,
                }}
              >
                {num}
              </Box>
            ))}
          </Stack>
        </Box>
      </Collapse>

      <Divider sx={{ mb: 3 }} />

      {!isSessionActive ? (
        <Box display="flex" justifyContent="center" height={32}>
          <Button onClick={() => startSession(sessionLength)}>Start</Button>
        </Box>
      ) : (
        <Box height={32} />
      )}

      {/* MAIN GAME */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <TimerContextProvider>
          <MultiplicationCard />
        </TimerContextProvider>
      </Box>
    </Box>
  )
}

export default PracticeArea
