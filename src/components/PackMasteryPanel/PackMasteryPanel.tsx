import { useMemo, type FC } from 'react'
import { Box, LinearProgress, Card, Typography } from '@mui/material'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { percentPackMastered } from '../../contexts/cardScheduler/helpers/srsLogic'

const PackMasteryPanel: FC = () => {
  const { activePackMeta, activePackFactIds } = useUser()
  const { userFacts } = useFirebaseContext()

  const masteryPercent = useMemo(() => {
    return percentPackMastered(userFacts, activePackMeta, activePackFactIds)
  }, [userFacts, activePackMeta, activePackFactIds])

  const formatPackName = (name?: string) => {
    if (!name) return 'Loading...'
    if (name === 'mul_36') return 'Multiplication 1-6'
    if (name === 'mul_144') return 'Multiplication 1-12'
    if (name === 'mul_576') return 'Multiplication 1-24'
    return name
  }
  return (
    <Card id="pack-mastery-panel" sx={{ flex: 1, minWidth: 280 }}>
      <Box p={2}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Pack Mastery: {formatPackName(activePackMeta?.packName)}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Box flex={1}>
            <LinearProgress
              variant="determinate"
              value={masteryPercent}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2">{masteryPercent}%</Typography>
        </Box>
      </Box>
    </Card>
  )
}

export default PackMasteryPanel
