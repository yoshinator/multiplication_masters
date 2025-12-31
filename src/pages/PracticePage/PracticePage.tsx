import { useEffect, type FC, useRef } from 'react'
import { Box, LinearProgress } from '@mui/material'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

import MultiplicationCard from '../../components/MultiplicationCard/MultiplicationCard'
import StatsPanel from '../../components/StatsPanel/StatsPanel'
import LevelPanel from '../../components/LevelPanel/LevelPanel'
import SessionSummary from '../../components/SessionSummary/SessionSummary'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useReviewSession } from '../../contexts/reviewSession/reviewSessionContext'
import WelcomeBack from '../../components/WelcomeBack/WelcomeBack'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen'
import { DailyGoalPanel } from '../../components/DailyGoalPanel/DailyGoalPanel'
import { useTimerActions } from '../../contexts/timerContext/timerContext'
import { DEFAULT_SESSION_LENGTH } from '../../constants/appConstants'

const INITIAL_TOUR_STATE = {
  welcome: false,
  session: false,
  summary: false,
}

const PracticePage: FC = () => {
  const { isSessionActive, setSessionLength } = useSessionStatusContext()
  const { latestSession, isSaving, isLoading, error } = useReviewSession()
  const { user } = useUser()
  const { showNotification } = useNotification()
  const isMobile = useIsMobile()
  const isKeyboardOpen = useKeyboardOpen()
  const tourState = useRef(INITIAL_TOUR_STATE)
  const { stopTimer } = useTimerActions()
  const driverRef = useRef<Driver | null>(null)
  const tourListenersRef = useRef<Array<() => void>>([])

  useEffect(() => {
    if (error) {
      showNotification(error, 'error')
    }
  }, [error, showNotification])

  const isPlayedSession =
    (latestSession?.endedAt ?? 0) >= (user?.lastLogin?.toMillis() ?? 0)

  /**
   * We don't really have a good way to cleanup in the useEffect
   * that handles the tour because destroying there wipes out the
   * driver object on every render since it lives outside React.
   *  */
  useEffect(() => {
    const cleanup = () => {
      if (driverRef.current) {
        driverRef.current.destroy()
      }
      // Execute all stored cleanup functions for event listeners
      tourListenersRef.current.forEach((fn) => fn())
      tourListenersRef.current = []
    }

    if (!user?.showTour) {
      cleanup()
      tourState.current = INITIAL_TOUR_STATE
    }
  }, [user?.showTour])

  useEffect(() => {
    if (!user?.showTour) return

    if (!driverRef.current) {
      driverRef.current = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
      })
    }

    const driverObj = driverRef.current

    const attachCloseListener = (selector: string, driverInstance: Driver) => {
      const element = document.querySelector(selector) as HTMLElement | null
      if (!element) return

      const closeTour = () => {
        driverInstance.destroy()
      }

      element.addEventListener('pointerdown', closeTour, { once: true })
      tourListenersRef.current.push(() => {
        element.removeEventListener('pointerdown', closeTour)
      })
    }

    if (!isSessionActive && !isPlayedSession && !tourState.current.welcome) {
      driverObj.setSteps([
        {
          element: '#header-logo',
          popover: {
            title: 'Go Home',
            description: 'Click here anytime to go back to the main screen.',
          },
        },
        {
          element: '#header-user-menu',
          popover: {
            title: 'Your Profile',
            description:
              'Change your settings here. You can make the game easier or harder, or change how many cards you play.',
          },
        },
        {
          element: '#level-panel',
          popover: {
            title: 'Level Up!',
            description:
              'Watch your progress bar grow! Every correct answer helps you reach the next level.',
          },
        },
        {
          element: '#daily-goal-panel',
          popover: {
            title: 'Daily Goal',
            description:
              'Try to finish this goal every day. It helps you learn faster!',
          },
        },
        {
          element: '#start-session-btn',
          popover: {
            title: 'Start Playing',
            description: 'Ready? Click here to start answering questions.',
          },
        },
      ])
      driverObj.drive()
      tourState.current.welcome = true
    } else if (isSessionActive && !tourState.current.session) {
      driverObj.destroy()

      setTimeout(() => {
        driverObj.setSteps([
          {
            element: '#game-card',
            popover: {
              title: 'The Question',
              description:
                'Here is your math problem. Multiply the left number by the right number.',
              onPopoverRender: stopTimer,
            },
          },
          {
            element: '#game-timer',
            popover: {
              title: 'Beat the Clock',
              description:
                'Answer while the bar is green to level up this card! If you take too long, you will have to practice it again.',
            },
          },
          {
            element: '#estimated-reviews',
            popover: {
              title: 'Cards Left',
              description:
                'This counts down how many cards are left in this game session.',
            },
          },
          {
            element: '#reviews-left',
            popover: {
              title: 'Practice Count',
              description:
                'This shows how many times you need to answer *this* card correctly today.',
            },
          },
          {
            element: '#game-input',
            popover: {
              title: 'Your Answer',
              description:
                'Type the answer here. I paused the timer for you this time!',
            },
            onHighlighted: (_el, _step, { driver }) => {
              attachCloseListener('#game-input', driver)
            },
          },
        ])
        driverObj.drive()
        tourState.current.session = true
      }, 0)
    } else if (
      isPlayedSession &&
      !isSessionActive &&
      !tourState.current.summary
    ) {
      tourState.current.summary = true

      driverObj.setConfig({
        onDestroyed: () => {
          // Also sets user.showTour false
          setSessionLength(DEFAULT_SESSION_LENGTH)
          tourState.current = INITIAL_TOUR_STATE
        },
      })

      driverObj.setSteps([
        {
          element: '#session-summary-card',
          popover: {
            title: 'Session Complete!',
            description: 'Great work! Check out your stats to see how you did.',
          },
          onHighlighted: (_el, _step, { driver }) => {
            attachCloseListener('#session-summary-card', driver)
          },
        },
        {
          element: '#play-again-btn',
          popover: {
            title: 'Keep Going',
            description: 'Want to play more? Click here to start another game.',
          },
          onHighlighted: (_el, _step, { driver }) => {
            attachCloseListener('#play-again-btn', driver)
          },
        },
      ])

      driverObj.drive()
    }
  }, [
    user?.showTour,
    isSessionActive,
    isPlayedSession,
    stopTimer,
    setSessionLength,
  ])

  useEffect(() => {
    if (isKeyboardOpen) {
      // Scroll to top so content is never partially hidden
      // I hate this but needed it for mobile safari. Chrome works fine.
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [isKeyboardOpen])

  return (
    <Box
      sx={{
        py: { xs: 0, sm: 2 },
        px: { xs: 0, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflowY: isKeyboardOpen ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {(isLoading || isSaving) && (
        <LinearProgress
          color={isLoading ? 'primary' : 'secondary'}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isSessionActive ? (
          !isMobile && <StatsPanel />
        ) : (
          <Box
            display="flex"
            gap={2}
            flexDirection={isMobile ? 'column' : 'row'}
            sx={{ width: { xs: '100%', sm: 'auto' }, px: { xs: 2, sm: 0 } }}
          >
            <LevelPanel />
            <DailyGoalPanel />
          </Box>
        )}
      </Box>

      {/* MAIN GAME */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: 1,
        }}
      >
        {/* if session is active display multiplication card, else if last session 
        happened after the last login display the summary if you just logged in and 
        have not played a session display the welcome back component*/}
        {isSessionActive ? (
          <MultiplicationCard />
        ) : isPlayedSession ? (
          <SessionSummary />
        ) : (
          <WelcomeBack />
        )}
      </Box>
    </Box>
  )
}

export default PracticePage
