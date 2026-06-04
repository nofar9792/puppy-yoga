import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser } from '../types.ts'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  authFetch: (url: string, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'puppy-yoga-auth'

function loadStored(): { user: AuthUser; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as { user: AuthUser; token: string } : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStored()
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null)
  const [token, setToken] = useState<string | null>(stored?.token ?? null)

  function persist(u: AuthUser, t: string) {
    setUser(u); setToken(t)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }))
  }

  async function signup(name: string, email: string, password: string) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json() as { token: string; user: AuthUser; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Signup failed')
    persist(data.user, data.token)
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { token: string; user: AuthUser; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Login failed')
    persist(data.user, data.token)
  }

  function logout() {
    setUser(null); setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const authFetch = useCallback((url: string, init: RequestInit = {}) => {
    return fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token ?? ''}` },
    })
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
