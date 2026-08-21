import React, { useCallback, useEffect, useState } from 'react'
import api from '../api/api'
import { connectSocket, disconnectSocket } from '../api/socket'
import { AuthContext } from './authContext.js'

const USER_KEY = 'ec_user'
const TOKEN_KEY = 'ec_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
      if (stored?.role === 'buyer' || stored?.role === 'seller') {
        return { ...stored, role: 'user', sellerApproved: stored.role === 'seller' || stored.sellerApproved }
      }
      return stored
    } catch { return null }
  })

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
    })()
    if (storedUser?.role === 'user' && token) connectSocket(token)

    const handleUnauthorized = () => {
      disconnectSocket()
      setUser(null)
    }
    window.addEventListener('ec:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('ec:unauthorized', handleUnauthorized)
  }, [])

  const persist = (userData, token) => {
    setUser(userData)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    localStorage.setItem(TOKEN_KEY, token)
    if (userData.role === 'user' && token) connectSocket(token)
    else disconnectSocket()
  }

  const loginAccount = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      persist(data.user, data.token)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Sign in failed' }
    }
  }

  const loginAdmin = async (email, password) => {
    try {
      const { data } = await api.post('/auth/admin/login', { email, password })
      persist(data.user, data.token)
      return { success: true, role: data.user.role }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Admin sign in failed' }
    }
  }

  const registerAccount = async (name, email, phone, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, phone, password })
      persist(data.user, data.token)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' }
    }
  }

  const logout = () => {
    disconnectSocket()
    setUser(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  const updateUser = useCallback((updates) => {
    setUser(current => {
      if (!current) return current
      const updated = { ...current, ...updates, capabilities: { ...current.capabilities, ...updates.capabilities } }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
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
