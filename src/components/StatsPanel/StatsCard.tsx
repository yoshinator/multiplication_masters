import { type FC, type ReactElement } from 'react'
import { Box, Typography, Card } from '@mui/material'

interface Props {
  icon: ReactElement
  label?: string
  value: string | number
  color: string
}

const StatsCard: FC<Props> = ({ icon, label, value, color }) => (
  <Card
    sx={{
      display: 'flex',
      flex: 1,
      p: 1,
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      borderRadius: 2,
      borderBottom: `3px solid ${color}`,
      boxShadow: 'none',
      transition: 'transform 0.25s ease',
      ':hover': { transform: 'translateY(-3px)' },
      minWidth: 75,
    }}
  >
    <Box sx={{ fontSize: 24 }}>{icon}</Box>

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

export default StatsCard
