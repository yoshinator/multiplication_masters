import { type FC, type ReactNode } from 'react'
import { useCardScheduler } from '../../hooks/useCardScheduler'
import { useFirebase } from '../useFirebase'
import { useUser } from '../user/useUserContext'
import { CardSchedulerContext } from './cardSchedulerContext'

interface Props {
  children: ReactNode
}

const CardSchedulerProvider: FC<Props> = ({ children }) => {
  const { userCards } = useFirebase()
  const { user } = useUser()
  const cardScheduler = useCardScheduler(userCards, user)

  return (
    <CardSchedulerContext.Provider value={cardScheduler}>
      {children}
    </CardSchedulerContext.Provider>
  )
}

export default CardSchedulerProvider
