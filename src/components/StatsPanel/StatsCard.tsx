import { type FC, type ReactElement } from 'react'
import { Box, Typography, Card } from '@mui/material'

interface Props {
  icon: ReactElement
  label?: string
  value: string | number
  color: string
}

const StatsCard: FC<Props> = ({ icon, label, value, color }) => {
  return (
    <Card
      component={Box}
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        minWidth: 75,

        p: { xs: 0.75, sm: 1 },
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',

        // Card behavior only on desktop
        borderRadius: { xs: 0, sm: 2 },
        borderBottom: { xs: 'none', sm: `3px solid ${color}` },
        bgcolor: { xs: 'transparent', sm: 'background.paper' },
        boxShadow: 'none',

        // Hover only where it makes sense
        transition: { sm: 'transform 0.25s ease' },
        '&:hover': {
          transform: { sm: 'translateY(-3px)' },
        },
      }}
    >
      <Box sx={{ fontSize: { xs: 22, sm: 24 } }}>{icon}</Box>

      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </Typography>

      {label && (
        <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.2 }}>
          {label}
        </Typography>
      )}
    </Card>
  )
}

export default StatsCard
