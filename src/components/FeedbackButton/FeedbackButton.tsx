import { type FC, useContext } from 'react'
import { Fab, Tooltip } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { SessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { ROUTES } from '../../constants/routeConstants'
import FeedbackModal from '../FeedbackModal/FeedbackModal'
import { useModal } from '../../contexts/modalContext/modalContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { isPublicInfoPath } from '../../constants/publicInfoRoutes'

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
  const isPublicInfoRoute = isPublicInfoPath(location.pathname, {
    includeHome: true,
  })
  const showNavFabOnMobilePublic = isMobile && isPublicInfoRoute
  const mobileNavTarget = isHomeRoute ? ROUTES.LEARN_MORE : ROUTES.HOME
  const mobileNavLabel = isHomeRoute ? 'Learn More' : 'Home'

  /**
   * Determines when the FAB should not render at all.
   * * Hidden on:
   * - all public-info routes on non-mobile (no FAB is shown)
   * - the /train route when a session is active
   * - the SceneBuilder route
   *
   * Note: on mobile public-info routes a navigation FAB is shown instead of a
   * feedback FAB; this is handled via `showNavFabOnMobilePublic`.
   */
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
