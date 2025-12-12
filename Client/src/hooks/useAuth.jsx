import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginUser, registerUser, me as fetchMe, logoutUser, loginWithGoogle } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const refresh = async () => {
    try {
      const u = await fetchMe()
      setUser(u)
      return u
    } catch (err) {
      setUser(null)
      return null
    }
  }

  const login = async (payload) => {
    setError(null)
    const u = await loginUser(payload)
    setUser(u)
    return u
  }

  const register = async (payload) => {
    setError(null)
    const u = await registerUser(payload)
    setUser(u)
    return u
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  const loginGoogle = async (credential) => {
    const u = await loginWithGoogle(credential)
    setUser(u)
    return u
  }

  const value = useMemo(() => ({ user, loading, error, login, register, logout, refresh, loginGoogle }), [user, loading, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}