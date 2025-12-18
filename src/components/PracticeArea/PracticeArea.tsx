import { type FC } from 'react'
import { Box } from '@mui/material'

import TimerContextProvider from '../../contexts/timer/TimerProvider'
import MultiplicationCard from '../MultiplicationCard/MultiplicationCard'
import StatsPanel from '../StatsPanel/StatsPanel'
import LevelPanel from '../LevelPanel/LevelPanel'
import SessionSummary from '../SessionSummary/SessionSummary'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useUser } from '../../contexts/user/useUserContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import WelcomeBack from '../WelcomeBack/WelcomeBack'

const PracticeArea: FC = () => {
  const { isSessionActive } = useSessionStatusContext()
  const { latestSession } = useReviewSession()
  const { user } = useUser()

  const isPlayedSession =
    (latestSession?.endedAt ?? 0) >= (user?.lastLogin?.toMillis() ?? 0)
  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      {/* TOP HUD: Level + Stats */}

      {/* StatsPanel sits next to LevelPanel */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isSessionActive ? <StatsPanel compact /> : <LevelPanel />}
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

export default PracticeArea
