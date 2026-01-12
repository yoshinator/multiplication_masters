import { useAuthActions } from './useAuthActions'
import { useModal } from '../contexts/modalContext/modalContext'

/**
 * Custom hook to manage saving progress with authentication actions.
 * User can link their Google account, snooze the upgrade prompt, or get a login link via email.
 *
 * @returns An object containing:
 * - `handleGoogleLink`: Function to handle linking Google account.
 * - `handleSnooze`: Function to handle snoozing the upgrade prompt.
 * - `handleEmailLink`: Function to handle sending a login link via email.
 */
export const useSaveProgress = () => {
  const { closeModal } = useModal()
  const { linkGoogleAccount, snoozeUpgradePrompt, sendLoginLink } =
    useAuthActions()

  const handleGoogleLink = async () => {
    try {
      await linkGoogleAccount()
      closeModal()
    } catch {
      // Error notification handled in hook
    }
  }

  const handleSnooze = async () => {
    await snoozeUpgradePrompt()
    closeModal()
  }

  const handleEmailLink = async (email: string) => {
    try {
      await sendLoginLink(email)
      // Optional: closeModal() here if you want to close immediately after sending
    } catch {
      // Error notification handled in hook
    }
  }

  return {
    handleGoogleLink,
    handleSnooze,
    handleEmailLink,
  }
}
