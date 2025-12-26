import { useEffect, type FC } from 'react'
import { Box } from '@mui/material'

import TimerContextProvider from '../../contexts/timerContext/TimerProvider'
import MultiplicationCard from '../../components/MultiplicationCard/MultiplicationCard'
import StatsPanel from '../../components/StatsPanel/StatsPanel'
import LevelPanel from '../../components/LevelPanel/LevelPanel'
import SessionSummary from '../../components/SessionSummary/SessionSummary'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import WelcomeBack from '../../components/WelcomeBack/WelcomeBack'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen'

const PracticePage: FC = () => {
  const { isSessionActive } = useSessionStatusContext()
  const { latestSession } = useReviewSession()
  const { user } = useUser()
  const isMobile = useIsMobile()
  const isKeyboardOpen = useKeyboardOpen()

  const isPlayedSession =
    (latestSession?.endedAt ?? 0) >= (user?.lastLogin?.toMillis() ?? 0)

  useEffect(() => {
    if (isKeyboardOpen) {
      // Scroll to top so content is never partially hidden
      // I hate this but needed it for mobile safari. Chrome works fine.
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [isKeyboardOpen])

  return (
    <Box
      sx={{
        py: { xs: 0, sm: 2 },
        px: { xs: 0, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflowY: isKeyboardOpen ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isSessionActive ? !isMobile && <StatsPanel /> : <LevelPanel />}
      </Box>

      {/* MAIN GAME */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: 1,
        }}
      >
        {/* if session is active display multiplication card, else if last session 
        happened after the last login display the summary if you just logged in and 
        have not played a session display the welcome back component*/}
        {isSessionActive ? (
          <TimerContextProvider>
            <MultiplicationCard />
          </TimerContextProvider>
        ) : isPlayedSession ? (
          <SessionSummary />
        ) : (
          <WelcomeBack />
        )}
      </Box>
    </Box>
  )
}

export default PracticePage
