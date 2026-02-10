import type { FC, ReactElement, ReactNode } from 'react'
import { Box, Card, Typography, type SxProps, type Theme } from '@mui/material'
import { useIsMobile } from '../../hooks/useIsMobile'

type Props = {
  id?: string
  title?: string
  icon?: ReactElement
  children: ReactNode
  overlay?: ReactNode
  wrapperSx?: SxProps<Theme>
  cardSx?: SxProps<Theme>
}

const PanelCard: FC<Props> = ({
  id,
  title,
  icon,
  children,
  overlay,
  wrapperSx,
  cardSx,
}) => {
  const isMobile = useIsMobile()

  return (
    <Box
      id={id}
      sx={{
        position: 'relative',
        width: { xs: '100%', sm: 340 },
        mx: { xs: 0, sm: 'auto' },
        height: '100%',
        ...wrapperSx,
      }}
    >
      <Card
        {...(isMobile ? { component: Box } : {})}
        elevation={0}
        sx={{
          height: '100%',
          p: { xs: 2, sm: 2.5 },
          pb: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 2 },
          border: { xs: 'none', sm: '1px solid' },
          borderColor: 'divider',
          bgcolor: { xs: 'transparent', sm: 'background.paper' },
          boxShadow: { xs: 'none', sm: 'inherit' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          ...cardSx,
        }}
      >
        {Boolean(title) && !isMobile && (
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
        )}

        {children}
      </Card>

      {overlay}
    </Box>
  )
}

export default PanelCard
