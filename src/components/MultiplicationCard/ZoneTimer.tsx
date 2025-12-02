import { type FC } from 'react'
import { Box } from '@mui/material'

interface Props {
  time: number
  maxTime: number
}
const ZoneTimer: FC<Props> = ({ time, maxTime }) => {
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
      {/* Layer 1: The Colored Zones (Background) 
         UPDATED: Switched to Vivid colors (Main/Dark/Light) instead of Pastels
      */}
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
        {/* 0-15%: Deep Red */}
        <Box sx={{ width: '15%', bgcolor: 'error.main' }} />

        {/* 15-XX%: Orange-Red (Vivid) instead of Warning.Main */}
        <Box sx={{ flex: 1, bgcolor: 'error.light' }} />

        {/* XX-XX%: Amber (Vivid) instead of Warning.Light */}
        <Box sx={{ flex: 1, bgcolor: 'warning.main' }} />

        {/* End: Green */}
        <Box sx={{ flex: 2, bgcolor: 'success.main' }} />
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
         UPDATED: Increased opacity so the "future" colors don't bleed through
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
