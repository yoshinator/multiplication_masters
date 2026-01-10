import { type FC, useState, useContext } from 'react'
import { Fab, Tooltip } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { SessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { ROUTES } from '../../constants/routeConstants'
import FeedbackModal from '../FeedbackModal/FeedbackModal'

const FeedbackButton: FC = () => {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const sessionStatus = useContext(SessionStatusContext)

  const isSessionActive = sessionStatus?.isSessionActive ?? false
  const isTrainRoute = location.pathname === ROUTES.TRAIN

  // Hidden when in /train route AND session is active
  if (isTrainRoute && isSessionActive) {
    return null
  }

  return (
    <>
      <Tooltip title="Send Feedback" placement="left">
        <Fab
          color="primary"
          aria-label="feedback"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          size="medium"
          variant="extended"
        >
          Feedback
        </Fab>
      </Tooltip>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default FeedbackButton
