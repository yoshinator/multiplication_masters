import { useCallback, useState, type FC, type ReactNode } from 'react'
import type { User } from '../../components/Login/useLogin'
import { UserContext } from './useUserContext'

type Props = {
  children: ReactNode
}

export const UserProvider: FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const updateUser = useCallback((fields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev))
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}
