import { useEffect, type FC, useRef } from 'react'
import { Box } from '@mui/material'
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
import { useIsMobile } from '../../hooks/useIsMobile'
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen'
import { DailyGoalPanel } from '../../components/DailyGoalPanel/DailyGoalPanel'
import { useTimerContext } from '../../contexts/timerContext/timerContext'

const PracticePage: FC = () => {
  const { isSessionActive } = useSessionStatusContext()
  const { latestSession } = useReviewSession()
  const { user, updateUser } = useUser()
  const isMobile = useIsMobile()
  const isKeyboardOpen = useKeyboardOpen()
  const tourState = useRef({ welcome: false, session: false, summary: false })
  const { stopTimer, startTimer } = useTimerContext()
  const driverRef = useRef<Driver | null>(null)
  const userRef = useRef(user)

  const makeDriver = () =>
    driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Done',
    })

  const isPlayedSession =
    (latestSession?.endedAt ?? 0) >= (user?.lastLogin?.toMillis() ?? 0)

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (!user?.showTour) return

    if (!driverRef.current) {
      driverRef.current = makeDriver()
    }

    const driverObj = driverRef.current
    if (!isSessionActive && !isPlayedSession && !tourState.current.welcome) {
      driverObj.setSteps([
        {
          element: '#header-logo',
          popover: {
            title: 'Home',
            description: 'Click here to go back home anytime.',
          },
        },
        {
          element: '#header-user-menu',
          popover: {
            title: 'Profile',
            description:
              'Manage your account and settings here. From your profile you can adjust the difficulty level and session length',
          },
        },
        {
          element: '#level-panel',
          popover: {
            title: 'Level Up!',
            description:
              "You are currently working through 8 skill groups. Start by mastering the basics (1–12) in Groups 1–4, then prove you're a true Multiplication Master in Groups 5–8 (up to 24)! Every correct answer helps fill your progress bar. Can you reach the top?",
          },
        },
        {
          element: '#daily-goal-panel',
          popover: {
            title: 'Perfect Practice',
            description:
              'This is where you start your daily practice. Finish this goal daily to get the most out of your sessions. If you completed your daily goal and want to continue you can always do more.',
          },
        },
        {
          element: '#start-session-btn',
          popover: {
            title: 'Start',
            description: 'Click here to begin your practice session.',
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
              title: 'Flashcard',
              description: 'Solve the multiplication problem.',
              onPopoverRender: stopTimer,
            },
          },
          {
            element: '#game-timer',
            popover: {
              title: 'Timer',
              description: 'Answer quickly to earn more points.',
            },
          },
          {
            element: '#estimated-reviews',
            popover: {
              title: 'Estimated Reviews',
              description:
                'This tells you about how many reviews you have left in the current session.',
            },
          },
          {
            element: '#reviews-left',
            popover: {
              title: 'Card Reviews Left',
              description:
                'Times you must answer this card correctly to finish it in this session',
            },
          },
          {
            element: '#game-input',
            popover: {
              title: 'Answer',
              description:
                "Type your answer here. I'll leave the timer stopped this one time to let you get started.",
            },
          },
        ])
        driverObj.drive()
        tourState.current.session = true
      }, 500)
    } else if (
      isPlayedSession &&
      !isSessionActive &&
      !tourState.current.summary
    ) {
      tourState.current.summary = true

      driverObj.setConfig({
        onDestroyed: () => {
          if (updateUser && userRef.current) {
            updateUser({ ...userRef.current, showTour: false })
          }
        },
      })

      driverObj.setSteps([
        {
          element: '#session-summary-card',
          popover: {
            title: 'Summary',
            description: 'Review your performance.',
          },
        },
        {
          element: '#play-again-btn',
          popover: { title: 'Continue', description: 'Start another session.' },
        },
      ])

      driverObj.drive()
    }
  }, [user?.showTour, isSessionActive, isPlayedSession, updateUser, stopTimer])

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
