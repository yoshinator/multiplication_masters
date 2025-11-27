import { useState, type FC } from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material'
import TimerContextProvider from '../../contexts/timer/TimerProvider'
import Timer from '../../components/Timer/Timer'
import MultiplicationCard from '../../components/MultiplicationCard/MultiplicationCard'
import StatsPanel from '../../components/StatsPanel/StatsPanel'
import LevelPanel from '../LevelPanel/LevelPanel'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'

const AppContent: FC = () => {
  const [sessionLength, setSessionLength] = useState<number>(30)
  const { isMastered } = useReviewSession()
  return (
    <>
      {/* Session Length Controls */}
      <FormControl>
        <FormLabel id="session-cards-length">Cards for session</FormLabel>
        <RadioGroup
          row
          aria-labelledby="session-cards-length"
          name="row-radio-buttons-group"
          value={sessionLength}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setSessionLength(parseInt(event.target.value))
          }
        >
          <FormControlLabel value={15} control={<Radio />} label="15" />
          <FormControlLabel value={30} control={<Radio />} label="30" />
          <FormControlLabel value={45} control={<Radio />} label="45" />
        </RadioGroup>
      </FormControl>

      {/* Top Area — Stats */}
      <Box sx={{ flexShrink: 0, m: 2 }}>
        <LevelPanel isMastered={isMastered} />
        <StatsPanel />
      </Box>

      {/* Main Game Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // center vertically
          alignItems: 'center', // center horizontally
          gap: 2,
          pb: 4,
        }}
      >
        <TimerContextProvider>
          <Box sx={{ mb: 2 }}>
            <Timer sessionLength={sessionLength} />
          </Box>

          <MultiplicationCard />
        </TimerContextProvider>
      </Box>
    </>
  )
}

export default AppContent
