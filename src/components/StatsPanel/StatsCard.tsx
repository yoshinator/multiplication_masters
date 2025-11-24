import { type FC, type ReactElement } from 'react'
import { Box, Typography, Card } from '@mui/material'

interface Props {
  icon: ReactElement
  label: string
  value: string | number
  color: string
}

const StatsCard: FC<Props> = ({ icon, label, value, color }) => (
  <Card
    sx={{
      flex: 1,
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      borderRadius: 3,
      borderBottom: `4px solid ${color}`,
      boxShadow: '0px 6px 20px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)',
      transition: 'transform 0.25s ease',
      ':hover': { transform: 'translateY(-3px)' },
    }}
  >
    <Box sx={{ fontSize: 36 }}>{icon}</Box>
    <Typography variant="h5" sx={{ fontWeight: 700 }}>
      {value}
    </Typography>
    <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
      {label}
    </Typography>
  </Card>
)

export default StatsCard
