import { useState, type FC, type ReactNode } from 'react'
import { ModalContext } from './modalContext'

type Props = {
  children: ReactNode
}

const ModalProvider: FC<Props> = ({ children }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)

  const openModal = (content: ReactNode) => {
    if (modalContent !== null) {
      // A modal is already open; this will replace the existing modal.
      // This warning helps detect unexpected multiple modal openings.
      console.warn(
        'ModalProvider.openModal was called while a modal is already open. The existing modal will be replaced.'
      )
    }
    setModalContent(content)
  }

  const closeModal = () => {
    setModalContent(null)
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalContent}
    </ModalContext.Provider>
  )
}

export default ModalProvider
