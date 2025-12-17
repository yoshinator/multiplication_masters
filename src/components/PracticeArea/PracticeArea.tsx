import { type FC } from 'react'
import { Box, Button } from '@mui/material'

import TimerContextProvider from '../../contexts/timer/TimerProvider'
import MultiplicationCard from '../MultiplicationCard/MultiplicationCard'
import StatsPanel from '../StatsPanel/StatsPanel'
import LevelPanel from '../LevelPanel/LevelPanel'
import SessionSummary from '../SessionSummary/SessionSummary'
import { useCardSchedulerContext } from '../../contexts/cardScheduler/cardSchedulerContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'

const PracticeArea: FC = () => {
  const { startSession } = useCardSchedulerContext()
  const { isSessionActive } = useSessionStatusContext()

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* TOP HUD: Level + Stats */}

      {/* StatsPanel sits next to LevelPanel */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          alignItems: 'center',
        }}
      >
        {isSessionActive ? <StatsPanel compact /> : <LevelPanel />}
      </Box>
      {!isSessionActive ? (
        <Box display="flex" justifyContent="center" height={32}>
          <Button onClick={() => startSession()}>Start</Button>
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
        {isSessionActive ? (
          <TimerContextProvider>
            <MultiplicationCard />
          </TimerContextProvider>
        ) : (
          <SessionSummary />
        )}
      </Box>
    </Box>
  )
}

export default PracticeArea
