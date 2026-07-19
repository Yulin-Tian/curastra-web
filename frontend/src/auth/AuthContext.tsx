import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../api/client'
import type { TokenResponse, User } from '../api/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .get<User>('/api/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<TokenResponse>('/api/auth/login', { email, password })
    setToken(res.token)
    setUser(res.user)
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post<TokenResponse>('/api/auth/register', { name, email, password })
    setToken(res.token)
    setUser(res.user)
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    setUser(await api.get<User>('/api/auth/me'))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
