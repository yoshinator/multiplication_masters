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
  disableClose?: boolean
  hideCloseButton?: boolean
}

const AppModal: FC<AppModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  disableClose = false,
  hideCloseButton = false,
}) => {
  const isMobile = useIsMobile()

  const handleClose = (_event: unknown, reason?: string) => {
    if (
      disableClose &&
      (reason === 'backdropClick' || reason === 'escapeKeyDown')
    ) {
      return
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth={maxWidth}
      fullWidth
      disableEscapeKeyDown={disableClose}
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
          {!hideCloseButton && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent>
        <Box>{children}</Box>
      </DialogContent>
    </Dialog>
  )
}

export default AppModal
