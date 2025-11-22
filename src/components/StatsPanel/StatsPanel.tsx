import { FC } from 'react'
import { Box, Card, Typography } from '@mui/material'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import { CheckCircle, Cancel, EmojiEvents } from '@mui/icons-material'

const StatsPanel: FC = () => {
  const { correctCount, incorrectCount } = useReviewSession()

  const accuracy =
    correctCount + incorrectCount === 0
      ? 100
      : Math.round((correctCount / (correctCount + incorrectCount)) * 100)

  const stats = [
    {
      label: 'Correct',
      value: correctCount,
      icon: <CheckCircle color="success" />,
      color: 'success.main',
    },
    {
      label: 'Incorrect',
      value: incorrectCount,
      icon: <Cancel color="error" />,
      color: 'error.main',
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: <EmojiEvents color="warning" />,
      color: 'warning.main',
    },
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
      }}
    >
      {stats.map((s) => (
        <Card
          key={s.label}
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow:
              '0px 6px 20px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.25s ease',
            borderBottom: `4px solid`,
            borderColor: s.color,
            ':hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0px 12px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <Box sx={{ fontSize: 36 }}>{s.icon}</Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
            {s.value}
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            {s.label}
          </Typography>
        </Card>
      ))}
    </Box>
  )
}

export default StatsPanel
