import { useState, type FC, type ReactNode } from 'react'
import { ModalContext } from './modalContext'

type Props = {
  children: ReactNode
}

const ModalProvider: FC<Props> = ({ children }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)

  const openModal = (content: ReactNode) => {
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
