import React, { useCallback, useContext, useEffect, useState } from 'react'
import api, { setCsrfToken } from '../api/api'
import { connectSocket, disconnectSocket } from '../api/socket'
import { AuthContext } from './authContext.js'
import { ToastContext } from './toastContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const toast = useContext(ToastContext)

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

  // Resolves true once the browser is really signed out. If the server could
  // not clear the session cookie we keep the user signed in and say so, rather
  // than showing a signed-out UI that the next reload would silently undo.
  const logout = async () => {
    const signOutLocally = () => {
      disconnectSocket()
      setCsrfToken('')
      setUser(null)
    }
    try {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        if (error.response?.status !== 403) throw error
        await refreshUser() // stale CSRF token: fetch a fresh one and retry once
        await api.post('/auth/logout')
      }
      signOutLocally()
      return true
    } catch (error) {
      if (error.response?.status === 401) { // the session had already ended
        signOutLocally()
        return true
      }
      toast?.showToast({ tone: 'error', title: 'Could not sign out', message: 'Check your connection and try again.' })
      return false
    }
  }

  const updateUser = useCallback((updates) => {
    setUser(current => {
      if (!current) return current
      const updated = { ...current, ...updates, capabilities: { ...current.capabilities, ...updates.capabilities } }
      return updated
    })
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/session')
    setCsrfToken(data.csrfToken)
    setUser(data.user)
    return data.user
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
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
