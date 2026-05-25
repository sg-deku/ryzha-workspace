import React, { createContext, useContext, useEffect, useState } from "react"
import { apiFetch, clearToken, getToken, setToken, API_BASE } from "./api"
import type { MobileAuthResponse, MobileUser } from "@ryzha/api-types"

interface AuthContextValue {
  user: MobileUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await getToken()
        if (stored) {
          const me = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
          })
          if (me.ok) {
            const data = await me.json()
            setUser(data.user)
            setTokenState(stored)
          } else {
            await clearToken()
          }
        }
      } catch {
        await clearToken()
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const login = async (email: string, password: string) => {
    const data = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!data.ok) {
      const body = await data.json().catch(() => ({ error: "Login failed" }))
      throw new Error(body.error || "Login failed")
    }

    const { token: newToken, user: newUser }: MobileAuthResponse = await data.json()
    await setToken(newToken)
    setTokenState(newToken)
    setUser(newUser)
  }

  const logout = async () => {
    await clearToken()
    setTokenState(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
