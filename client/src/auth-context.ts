import { createContext, useContext } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { User } from './types.ts'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  setUser: Dispatch<SetStateAction<User | null>>
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within an AuthProvider')
  return value
}
