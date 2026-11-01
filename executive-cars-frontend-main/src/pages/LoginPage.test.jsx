import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.jsx'
import AdminLoginPage from './admin/AdminLoginPage.jsx'
import { AuthContext } from '../context/authContext.js'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn() } }))

const renderWith = (page, sessionNotice) => render(
  <AuthContext.Provider value={{ user: null, sessionNotice, loginAccount: vi.fn(), loginAdmin: vi.fn() }}>
    <MemoryRouter>{page}</MemoryRouter>
  </AuthContext.Provider>,
)

describe('session notice on the sign-in screens', () => {
  it('explains an expired session on the customer sign-in page', () => {
    renderWith(<LoginPage />, 'expired')
    expect(screen.getByText('Your session expired')).toBeInTheDocument()
    expect(screen.getByText(/inactivity/i)).toBeInTheDocument()
  })

  it('explains a revoked session on the administrator sign-in page', () => {
    renderWith(<AdminLoginPage />, 'revoked')
    expect(screen.getByText('You were signed out')).toBeInTheDocument()
    expect(screen.getByText(/password was changed|signed out on another device/i)).toBeInTheDocument()
  })

  it('shows nothing when the visitor simply has no session', () => {
    renderWith(<LoginPage />, null)
    expect(screen.queryByText('Your session expired')).not.toBeInTheDocument()
    expect(screen.queryByText('You were signed out')).not.toBeInTheDocument()
  })
})
