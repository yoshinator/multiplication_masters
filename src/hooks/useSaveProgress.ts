import { useState } from 'react'
import { useAuthActions } from './useAuthActions'

/**
 * Custom hook to manage saving progress with authentication actions.
 * User can link their Google account, snooze the upgrade prompt, or get a login link via email.
 *
 * @returns An object containing:
 * - `saveModalOpen`: Boolean indicating if the save progress modal is open.
 * - `setSaveModalOpen`: Function to set the state of `saveModalOpen`.
 * - `handleGoogleLink`: Function to handle linking Google account.
 * - `handleSnooze`: Function to handle snoozing the upgrade prompt.
 * - `handleEmailLink`: Function to handle sending a login link via email.
 */
export const useSaveProgress = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const { linkGoogleAccount, snoozeUpgradePrompt, sendLoginLink } =
    useAuthActions()

  const handleGoogleLink = async () => {
    try {
      await linkGoogleAccount()
      setSaveModalOpen(false)
    } catch {
      // Error notification handled in hook
    }
  }

  const handleSnooze = async () => {
    await snoozeUpgradePrompt()
    setSaveModalOpen(false)
  }

  const handleEmailLink = async (email: string) => {
    try {
      await sendLoginLink(email)
    } catch {
      // Error notification handled in hook
    }
  }

  return {
    saveModalOpen,
    setSaveModalOpen,
    handleGoogleLink,
    handleSnooze,
    handleEmailLink,
  }
}
