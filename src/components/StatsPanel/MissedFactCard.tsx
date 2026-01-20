import { type FC } from 'react'
import { Card, Typography, Chip, Stack, alpha } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useIsMobile } from '../../hooks/useIsMobile'

interface Props {
  expression?: string
  incorrect: number
  seen: number
  avgResponseTime?: number | null
}

const MissedFactCard: FC<Props> = ({
  expression,
  incorrect,
  seen,
  avgResponseTime,
}) => {
  const isMobile = useIsMobile()
  const showLabels = !isMobile

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'error.main',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'background.paper'
            : alpha(theme.palette.error.main, 0.05),
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <Typography variant="h5" fontWeight="800" gutterBottom>
        {expression}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        justifyContent="center"
        useFlexGap
        sx={{ mt: 0.5 }}
      >
        <Chip
          icon={<CloseIcon />}
          label={`${incorrect}${showLabels ? ' incorrect' : ''}`}
          size="small"
          color="error"
          variant="filled"
          sx={{ fontWeight: 'bold', px: 0.5 }}
          title="Times Incorrect"
        />
        <Chip
          icon={<VisibilityIcon />}
          label={`${seen}${showLabels ? ' seen' : ''}`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'text.secondary',
            color: 'text.secondary',
            px: 0.5,
          }}
          title="Times Seen"
        />
        {avgResponseTime !== undefined && avgResponseTime !== null && (
          <Chip
            icon={<AccessTimeIcon />}
            label={`${(avgResponseTime / 1000).toFixed(1)}s${showLabels ? ' avg' : ''}`}
            size="small"
            variant="outlined"
            color="warning"
            title="Avg Response Time"
          />
        )}
      </Stack>
    </Card>
  )
}

export default MissedFactCard
