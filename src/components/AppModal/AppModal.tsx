import type { FC, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useIsMobile } from '../../hooks/useIsMobile'

type AppModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md'
}

const AppModal: FC<AppModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
}) => {
  const isMobile = useIsMobile()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 2,
            position: isMobile ? 'absolute' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            m: 0,
          },
        },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 1,
          }}
        >
          {title}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent>
        <Box>{children}</Box>
      </DialogContent>
    </Dialog>
  )
}

export default AppModal
