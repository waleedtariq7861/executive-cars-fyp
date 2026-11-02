import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './authContext.js'
import api, { setCsrfToken } from '../api/api.js'
import { disconnectSocket } from '../api/socket.js'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() }, setCsrfToken: vi.fn() }))
vi.mock('../api/socket.js', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

let outcome
function Probe() {
  const { user, loginAdmin, completeAdminMfa } = useAuth()
  return <div>
    <span>{user ? `${user.role}:${user.email}` : 'anonymous'}</span>
    <button onClick={async () => { outcome = await loginAdmin('admin@example.com', 'admin-pass-123') }}>Password step</button>
    <button onClick={async () => { outcome = await completeAdminMfa('challenge-token', '123456') }}>Code step</button>
  </div>
}

beforeEach(() => {
  vi.clearAllMocks()
  outcome = undefined
  api.get.mockRejectedValue({ response: { status: 401 } })
})

describe('administrator sign-in in the auth context', () => {
  it('a password-only answer signs in as before', async () => {
    api.post.mockResolvedValue({ data: { user: { role: 'admin', email: 'admin@example.com' }, csrfToken: 'csrf-1' } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('anonymous')
    fireEvent.click(screen.getByRole('button', { name: 'Password step' }))
    expect(await screen.findByText('admin:admin@example.com')).toBeInTheDocument()
    expect(outcome).toEqual({ success: true, role: 'admin' })
    expect(setCsrfToken).toHaveBeenCalledWith('csrf-1')
  })

  it('a challenge answer signs nobody in and hands the challenge to the page', async () => {
    api.post.mockResolvedValue({ data: { mfaRequired: true, challenge: 'challenge-token', expiresInSeconds: 300 } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('anonymous')
    fireEvent.click(screen.getByRole('button', { name: 'Password step' }))
    await vi.waitFor(() => expect(outcome).toBeDefined())
    expect(outcome).toEqual({ success: false, mfaRequired: true, challenge: 'challenge-token', expiresInSeconds: 300 })
    expect(screen.getByText('anonymous')).toBeInTheDocument()
    expect(setCsrfToken).not.toHaveBeenCalledWith(expect.stringContaining('csrf'))
  })

  it('the code step signs in with the session the server created', async () => {
    api.post.mockResolvedValue({ data: { user: { role: 'admin', email: 'admin@example.com', mfaEnabled: true }, csrfToken: 'csrf-2' } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('anonymous')
    fireEvent.click(screen.getByRole('button', { name: 'Code step' }))
    expect(await screen.findByText('admin:admin@example.com')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/admin/login/mfa', { challenge: 'challenge-token', code: '123456' })
    expect(outcome).toEqual({ success: true, role: 'admin' })
    expect(disconnectSocket).toHaveBeenCalled()
  })

  it('a refused code leaves the person signed out and passes the server\'s reason on', async () => {
    api.post.mockRejectedValue({ response: { status: 401, data: { message: 'That code is incorrect or has already been used.', code: 'MFA_CODE_INVALID', errors: { code: 'That code is incorrect or has already been used.' } } } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('anonymous')
    fireEvent.click(screen.getByRole('button', { name: 'Code step' }))
    await vi.waitFor(() => expect(outcome).toBeDefined())
    expect(outcome).toMatchObject({ success: false, code: 'MFA_CODE_INVALID', message: 'That code is incorrect or has already been used.' })
    expect(outcome.fieldErrors.code).toBeTruthy()
    expect(screen.getByText('anonymous')).toBeInTheDocument()
  })
})
