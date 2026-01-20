import { type FC, type ReactNode } from 'react'
import { useCardScheduler } from './useCardScheduler'

import { useUser } from '../userContext/useUserContext'
import { CardSchedulerContext } from './cardSchedulerContext'
import { useFirebaseContext } from '../firebase/firebaseContext'

interface Props {
  children: ReactNode
}

const CardSchedulerProvider: FC<Props> = ({ children }) => {
  const { userFacts } = useFirebaseContext()
  const { user, updateUser, activePackMeta } = useUser()
  const cardScheduler = useCardScheduler(
    userFacts,
    user,
    activePackMeta,
    updateUser
  )

  return (
    <CardSchedulerContext.Provider value={cardScheduler}>
      {children}
    </CardSchedulerContext.Provider>
  )
}

export default CardSchedulerProvider
