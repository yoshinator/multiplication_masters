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
  const { profile, updateUser, activePackMeta, activePackFactIds } = useUser()
  const cardScheduler = useCardScheduler(
    userFacts,
    profile,
    activePackMeta,
    updateUser,
    activePackFactIds
  )

  return (
    <CardSchedulerContext.Provider value={cardScheduler}>
      {children}
    </CardSchedulerContext.Provider>
  )
}

export default CardSchedulerProvider
