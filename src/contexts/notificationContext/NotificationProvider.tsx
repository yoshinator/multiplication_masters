import {
  type FC,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  Alert,
  Snackbar,
  type AlertColor,
  type SnackbarCloseReason,
} from '@mui/material'

import { NotificationContext, type Notification } from './NotificationContext'

interface Props {
  children: ReactNode
}
export const NotificationProvider: FC<Props> = ({ children }) => {
  const [snackPack, setSnackPack] = useState<readonly Notification[]>([])
  const [open, setOpen] = useState(false)
  const [messageInfo, setMessageInfo] = useState<Notification | undefined>(
    undefined
  )

  useEffect(() => {
    if (snackPack.length && !messageInfo) {
      // Set a new snack when we don't have an active one
      setMessageInfo({ ...snackPack[0] })
      setSnackPack((prev) => prev.slice(1))
      setOpen(true)
    } else if (snackPack.length && messageInfo && open) {
      // Close when new one added
      setOpen(false)
    }
  }, [snackPack, messageInfo, open])

  const showNotification = useCallback(
    (message: string, severity: AlertColor = 'info') => {
      setSnackPack((prev) => [
        ...prev,
        { id: new Date().getTime() + Math.random(), message, severity },
      ])
    },
    []
  )

  const handleClose = (
    _event: SyntheticEvent | Event | null,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const handleExited = () => {
    setMessageInfo(undefined)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        key={messageInfo ? messageInfo.id : undefined}
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        slotProps={{ transition: { onExited: handleExited } }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          top: { xs: 8, sm: 24 },
          right: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 'auto' },
        }}
      >
        <Alert
          onClose={handleClose}
          severity={messageInfo?.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: 1,
            fontWeight: 700,
            boxShadow: 6,
          }}
        >
          {messageInfo?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}
