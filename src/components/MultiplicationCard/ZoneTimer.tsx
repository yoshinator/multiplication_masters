import { type FC } from 'react'
import { Box } from '@mui/material'
import {
  BOX_ADVANCE,
  BOX_REGRESS,
  BOX_STAY,
} from '../../constants/appConstants'
import { useTimerValue } from '../../contexts/timerContext/timerContext'

interface Props {
  maxTime: number
}

// Total time represented by the zones (9000ms)
const TOTAL_THRESHOLD_MS = BOX_REGRESS

// Calculate the duration of each section
const DURATION_ADVANCE_MS = BOX_ADVANCE
const DURATION_STAY_MS = BOX_STAY - BOX_ADVANCE
const DURATION_REGRESS_MS = TOTAL_THRESHOLD_MS - BOX_STAY

const TIMEOUT_ZONE_PERCENT = 1 // 1% for the final error.main zone
const AVAILABLE_PERCENT = 100 - TIMEOUT_ZONE_PERCENT // 99% for the three main zones

// Calculate proportional widths for the 99%
const ADVANCE_WIDTH =
  (DURATION_ADVANCE_MS / TOTAL_THRESHOLD_MS) * AVAILABLE_PERCENT
const STAY_WIDTH = (DURATION_STAY_MS / TOTAL_THRESHOLD_MS) * AVAILABLE_PERCENT
const REGRESS_WIDTH =
  (DURATION_REGRESS_MS / TOTAL_THRESHOLD_MS) * AVAILABLE_PERCENT
const ZoneTimer: FC<Props> = ({ maxTime }) => {
  const time = useTimerValue()
  const progressPercent = Math.min(Math.max((time / maxTime) * 100, 0), 100)

  //   The transition is disabled only when the bar is visually full
  const isResetting = progressPercent >= 99.99

  return (
    <Box
      sx={{
        position: 'relative',
        height: 12,
        width: '100%',
        mt: 0,
        bgcolor: 'grey.300', // The color of the "empty" track
      }}
    >
      {/* Layer 1: The Colored Zones (Background)*/}
      <Box
        sx={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Box
          sx={{ width: `${TIMEOUT_ZONE_PERCENT}%`, bgcolor: 'error.main' }}
        />
        <Box sx={{ width: `${REGRESS_WIDTH}%`, bgcolor: 'warning.main' }} />
        <Box sx={{ width: `${STAY_WIDTH}%`, bgcolor: 'warning.light' }} />
        <Box sx={{ width: `${ADVANCE_WIDTH}%`, bgcolor: 'success.main' }} />
      </Box>

      {/* Layer 2: The "Curtain" (The Active Bar Indicator) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progressPercent}%`,
          // Changed to fully transparent so it doesn't lighten the colors below
          bgcolor: 'transparent',
          borderRight: '2px solid white',
          transition: isResetting ? 'none' : 'width 0.1s linear',
          zIndex: 2,
        }}
      />

      {/* Layer 3: The "Future/Empty" area 
         and wash out the look.
      */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: `${100 - progressPercent}%`,
          bgcolor: 'grey.300', // Solid grey looks cleaner than semi-transparent white
          opacity: 1, // Solid opacity prevents "ghosting"
          zIndex: 3,
          transition: isResetting ? 'none' : 'width 0.1s linear',
        }}
      />
    </Box>
  )
}

export default ZoneTimer
