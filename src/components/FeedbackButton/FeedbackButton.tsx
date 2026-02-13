import { type FC, useContext } from 'react'
import { Fab, Tooltip } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { SessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { ROUTES } from '../../constants/routeConstants'
import FeedbackModal from '../FeedbackModal/FeedbackModal'
import { useModal } from '../../contexts/modalContext/modalContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const FeedbackButton: FC = () => {
  const { closeModal, openModal } = useModal()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const sessionStatus = useContext(SessionStatusContext)

  const isSessionActive = sessionStatus?.isSessionActive ?? false
  const isTrainRoute = location.pathname === ROUTES.TRAIN
  const isHomeRoute = location.pathname === ROUTES.HOME
  const showLearnMoreOnMobileHome = isMobile && isHomeRoute

  /**
   *  Hidden when in /train route AND session is active. Hidden on the homepage and SceneBuilder page.
   *
   * */
  const isHidden =
    !showLearnMoreOnMobileHome &&
    ((isTrainRoute && isSessionActive) ||
      isHomeRoute ||
      location.pathname === ROUTES.BUILDER)

  if (isHidden) {
    return null
  }

  return (
    <>
      <Tooltip
        title={showLearnMoreOnMobileHome ? 'Learn More' : 'Send Feedback'}
        placement="left"
      >
        <Fab
          color="primary"
          aria-label={showLearnMoreOnMobileHome ? 'learn more' : 'feedback'}
          onClick={() => {
            if (showLearnMoreOnMobileHome) {
              navigate(ROUTES.LEARN_MORE)
              return
            }

            openModal(<FeedbackModal onClose={closeModal} />)
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          size="medium"
          variant="extended"
        >
          {showLearnMoreOnMobileHome ? 'Learn More' : 'Feedback'}
        </Fab>
      </Tooltip>
    </>
  )
}

export default FeedbackButton
