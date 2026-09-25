import React, { useCallback, useEffect, useState } from 'react'
import api, { setCsrfToken } from '../api/api'
import { connectSocket, disconnectSocket } from '../api/socket'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const handleUnauthorized = () => {
      disconnectSocket()
      setUser(null)
    }
    window.addEventListener('ec:unauthorized', handleUnauthorized)
    api.get('/auth/session').then(({ data }) => {
      setCsrfToken(data.csrfToken)
      setUser(data.user)
      if (data.user?.role === 'user') connectSocket()
    }).catch(() => {
      setCsrfToken('')
      setUser(null)
    }).finally(() => setInitializing(false))
    return () => window.removeEventListener('ec:unauthorized', handleUnauthorized)
  }, [])

  const persist = (userData, nextCsrfToken) => {
    setUser(userData)
    setCsrfToken(nextCsrfToken)
    if (userData.role === 'user') connectSocket()
    else disconnectSocket()
  }

  const loginAccount = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      persist(data.user, data.csrfToken)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Sign in failed' }
    }
  }

  const loginAdmin = async (email, password) => {
    try {
      const { data } = await api.post('/auth/admin/login', { email, password })
      persist(data.user, data.csrfToken)
      return { success: true, role: data.user.role }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Admin sign in failed' }
    }
  }

  const registerAccount = async (name, email, phone, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, phone, password })
      persist(data.user, data.csrfToken)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      disconnectSocket()
      setCsrfToken('')
      setUser(null)
    }
  }

  const updateUser = useCallback((updates) => {
    setUser(current => {
      if (!current) return current
      const updated = { ...current, ...updates, capabilities: { ...current.capabilities, ...updates.capabilities } }
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      initializing,
      loginAccount,
      loginAdmin,
      registerAccount,
      registerMember: registerAccount,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
