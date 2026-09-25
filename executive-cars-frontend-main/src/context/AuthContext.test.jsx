import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './authContext.js'
import api, { setCsrfToken } from '../api/api.js'
import { connectSocket, disconnectSocket } from '../api/socket.js'

vi.mock('../api/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  setCsrfToken: vi.fn(),
}))
vi.mock('../api/socket.js', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

function SessionProbe() {
  const { user, initializing, loginAccount, logout } = useAuth()
  return <div>
    <span>{initializing ? 'initializing' : user?.email || 'anonymous'}</span>
    <button onClick={() => loginAccount('member@example.com', 'password-123')}>Login</button>
    <button onClick={logout}>Logout</button>
  </div>
}

describe('AuthProvider cookie session lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockRejectedValue({ response: { status: 401 } })
    api.post.mockResolvedValue({ data: {} })
  })

  it('restores a server session and connects the customer socket without reading a browser token', async () => {
    const user = { id: 'member-1', email: 'member@example.com', role: 'user' }
    api.get.mockResolvedValue({ data: { user, csrfToken: 'csrf-session-token' } })

    render(<AuthProvider><SessionProbe /></AuthProvider>)

    expect(screen.getByText('initializing')).toBeInTheDocument()
    expect(await screen.findByText('member@example.com')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/auth/session')
    expect(setCsrfToken).toHaveBeenCalledWith('csrf-session-token')
    expect(connectSocket).toHaveBeenCalledWith()
  })

  it('uses the CSRF token returned by login and clears the server session on logout', async () => {
    api.post.mockResolvedValueOnce({ data: {
      user: { id: 'member-2', email: 'member@example.com', role: 'user' },
      csrfToken: 'csrf-login-token',
    } })

    render(<AuthProvider><SessionProbe /></AuthProvider>)
    await screen.findByText('anonymous')
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByText('member@example.com')).toBeInTheDocument()
    expect(setCsrfToken).toHaveBeenCalledWith('csrf-login-token')

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/logout'))
    expect(await screen.findByText('anonymous')).toBeInTheDocument()
    expect(disconnectSocket).toHaveBeenCalled()
    expect(setCsrfToken).toHaveBeenLastCalledWith('')
  })
})
