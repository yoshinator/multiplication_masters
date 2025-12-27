import { type AlertColor } from '@mui/material'
import { createContext, useContext } from 'react'

export interface Notification {
  id: number
  message: string
  severity: AlertColor
}

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    )
  }
  return context
}
