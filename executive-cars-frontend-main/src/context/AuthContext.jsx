import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import api, { setCsrfToken } from '../api/api'
import { connectSocket, disconnectSocket } from '../api/socket'
import { AuthContext } from './authContext.js'
import { ToastContext } from './toastContext.js'
import { readApiError } from '../utils/apiError.js'

const SESSION_NOTICES = { SESSION_EXPIRED: 'expired', SESSION_REVOKED: 'revoked' }
const AUTH_CHANNEL = 'ec-auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const toast = useContext(ToastContext)
  // Where a protected page should send the user right after an intentional sign out.
  const [logoutRedirect, setLogoutRedirect] = useState(null)
  const clearLogoutRedirect = useCallback(() => setLogoutRedirect(null), [])
  // Why a signed-in user was signed out without asking ("expired" or "revoked"); shown on the sign-in screen.
  const [sessionNotice, setSessionNotice] = useState(null)
  const dismissSessionNotice = useCallback(() => setSessionNotice(null), [])
  const userRef = useRef(null)
  userRef.current = user
  const channelRef = useRef(null)
  // Other tabs only learn that something happened (never any credential) and re-check with the server.
  const announce = type => channelRef.current?.postMessage({ type })

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/session')
    setCsrfToken(data.csrfToken)
    setUser(data.user)
    return data.user
  }, [])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined
    const channel = new BroadcastChannel(AUTH_CHANNEL)
    channelRef.current = channel
    channel.onmessage = ({ data }) => {
      if (data?.type === 'signed-out') {
        disconnectSocket()
        setCsrfToken('')
        setUser(null)
      } else if (data?.type === 'signed-in') {
        refreshUser().catch(() => {})
      }
    }
    return () => { channel.close(); channelRef.current = null }
  }, [refreshUser])

  useEffect(() => {
    const handleUnauthorized = event => {
      const notice = SESSION_NOTICES[event.detail?.code]
      if (notice && userRef.current) setSessionNotice(notice)
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
    setLogoutRedirect(null) // a new sign-in ends any pending sign-out landing
    setSessionNotice(null)
    setUser(userData)
    setCsrfToken(nextCsrfToken)
    if (userData.role === 'user') connectSocket()
    else disconnectSocket()
    announce('signed-in')
  }

  const loginAccount = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      persist(data.user, data.csrfToken)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, ...readApiError(error, 'Sign in failed') }
    }
  }

  const loginAdmin = async (email, password) => {
    try {
      const { data } = await api.post('/auth/admin/login', { email, password })
      persist(data.user, data.csrfToken)
      return { success: true, role: data.user.role }
    } catch (error) {
      return { success: false, ...readApiError(error, 'Admin sign in failed') }
    }
  }

  const registerAccount = async (name, email, phone, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, phone, password })
      persist(data.user, data.csrfToken)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, ...readApiError(error, 'Registration failed') }
    }
  }

  // Resolves true once the browser is really signed out. If the server could
  // not clear the session cookie we keep the user signed in and say so, rather
  // than showing a signed-out UI that the next reload would silently undo.
  const logout = async redirectTo => {
    const destination = typeof redirectTo === 'string' ? redirectTo : null
    const signOutLocally = () => {
      disconnectSocket()
      setCsrfToken('')
      setUser(null)
      announce('signed-out')
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
      if (destination) setLogoutRedirect(destination)
      return true
    } catch (error) {
      if (error.response?.status === 401) { // the session had already ended
        signOutLocally()
        if (destination) setLogoutRedirect(destination)
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

  return (
    <AuthContext.Provider value={{
      user,
      initializing,
      loginAccount,
      loginAdmin,
      registerAccount,
      registerMember: registerAccount,
      logout,
      logoutRedirect,
      clearLogoutRedirect,
      sessionNotice,
      dismissSessionNotice,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
