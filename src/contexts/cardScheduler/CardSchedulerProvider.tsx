import { type FC, type ReactNode } from 'react'
import { useCardScheduler } from './useCardScheduler'

import { useUser } from '../userContext/useUserContext'
import { CardSchedulerContext } from './cardSchedulerContext'
import { useFirebaseContext } from '../firebase/firebaseContext'

interface Props {
  children: ReactNode
}

const CardSchedulerProvider: FC<Props> = ({ children }) => {
  const { userCards } = useFirebaseContext()
  const { user } = useUser()
  const cardScheduler = useCardScheduler(userCards, user)

  return (
    <CardSchedulerContext.Provider value={cardScheduler}>
      {children}
    </CardSchedulerContext.Provider>
  )
}

export default CardSchedulerProvider
