import { type FC, useContext } from 'react'
import { Fab, Tooltip } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { SessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { ROUTES } from '../../constants/routeConstants'
import FeedbackModal from '../FeedbackModal/FeedbackModal'
import { useModal } from '../../contexts/modalContext/modalContext'

const FeedbackButton: FC = () => {
  const { closeModal, openModal } = useModal()
  const location = useLocation()
  const sessionStatus = useContext(SessionStatusContext)

  const isSessionActive = sessionStatus?.isSessionActive ?? false
  const isTrainRoute = location.pathname === ROUTES.TRAIN

  /**
   *  Hidden when in /train route AND session is active. Hidden on the homepage and SceneBuilder page.
   *
   * */
  const isHidden =
    (isTrainRoute && isSessionActive) ||
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.BUILDER

  if (isHidden) {
    return null
  }

  return (
    <>
      <Tooltip title="Send Feedback" placement="left">
        <Fab
          color="primary"
          aria-label="feedback"
          onClick={() => openModal(<FeedbackModal onClose={closeModal} />)}
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
    </>
  )
}

export default FeedbackButton
