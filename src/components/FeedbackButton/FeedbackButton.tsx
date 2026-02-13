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
  const isBuilderRoute = location.pathname === ROUTES.BUILDER
  const isHomeRoute = location.pathname === ROUTES.HOME
  const isPublicInfoRoute =
    isHomeRoute ||
    location.pathname === ROUTES.LEARN_MORE ||
    location.pathname === ROUTES.PRIVACY ||
    location.pathname === ROUTES.TERMS ||
    location.pathname === ROUTES.COPPA ||
    location.pathname === ROUTES.FERPA
  const showNavFabOnMobilePublic = isMobile && isPublicInfoRoute
  const mobileNavTarget = isHomeRoute ? ROUTES.LEARN_MORE : ROUTES.HOME
  const mobileNavLabel = isHomeRoute ? 'Learn More' : 'Home'

  /**
   *  Hidden when in /train route AND session is active. Hidden on the homepage and SceneBuilder page.
   *
   * */
  const isHidden =
    (isPublicInfoRoute && !showNavFabOnMobilePublic) ||
    (isTrainRoute && isSessionActive) ||
    isBuilderRoute

  if (isHidden) {
    return null
  }

  return (
    <>
      <Tooltip
        title={showNavFabOnMobilePublic ? mobileNavLabel : 'Send Feedback'}
        placement="left"
      >
        <Fab
          color="primary"
          aria-label={showNavFabOnMobilePublic ? mobileNavLabel : 'feedback'}
          onClick={() => {
            if (showNavFabOnMobilePublic) {
              navigate(mobileNavTarget)
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
          {showNavFabOnMobilePublic ? mobileNavLabel : 'Feedback'}
        </Fab>
      </Tooltip>
    </>
  )
}

export default FeedbackButton
