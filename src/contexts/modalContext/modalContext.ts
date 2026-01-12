import { createContext, useContext, type ReactNode } from 'react'

interface ModalContextValue {
  openModal: (content: ReactNode) => void
  closeModal: () => void
}

export const ModalContext = createContext<ModalContextValue | undefined>(
  undefined
)

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
