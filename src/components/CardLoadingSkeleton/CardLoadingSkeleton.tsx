import { Box, Skeleton } from '@mui/material'
import { useIsMobile } from '../../hooks/useIsMobile'

const CardLoadingSkeleton = () => {
  const isMobile = useIsMobile()

  return (
    <Box sx={{ width: '100%', p: isMobile ? 2 : 0 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: isMobile ? 1 : 2,
        }}
      >
        <Skeleton variant="rounded" width={110} height={32} />
        <Skeleton variant="rounded" width={110} height={32} />
      </Box>
      <Box sx={{ mb: 4 }}>
        <Skeleton
          variant="circular"
          width={80}
          height={80}
          sx={{ mb: 0.5, mx: 'auto' }}
        />
        <Skeleton
          variant="rectangular"
          height={12}
          width="100%"
          sx={{ borderRadius: 1 }}
        />
      </Box>
      <Skeleton
        variant="text"
        width="50%"
        height={isMobile ? 60 : 100}
        sx={{ mx: 'auto', mb: 2 }}
      />
      <Skeleton variant="rounded" height={isMobile ? 80 : 100} width="100%" />
    </Box>
  )
}

export default CardLoadingSkeleton
