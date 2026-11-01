import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage.jsx'
import AdminLoginPage from './admin/AdminLoginPage.jsx'
import { AuthContext } from '../context/authContext.js'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn() } }))

const renderWith = (page, sessionNotice, auth = {}) => render(
  <AuthContext.Provider value={{ user: null, sessionNotice, loginAccount: vi.fn(), loginAdmin: vi.fn(), ...auth }}>
    <MemoryRouter>{page}</MemoryRouter>
  </AuthContext.Provider>,
)

describe('session notice on the sign-in screens', () => {
  it('explains an expired session on the customer sign-in page', () => {
    renderWith(<LoginPage />, 'expired')
    expect(screen.getByText('Your session expired')).toBeInTheDocument()
    expect(screen.getByText(/inactivity/i)).toBeInTheDocument()
  })

  it('keeps the administrator page free of customer and seller sign-in links and of a public list of admin capabilities', () => {
    renderWith(<AdminLoginPage />, null)
    expect(document.querySelector('a[href="/login"]')).toBeNull()
    expect(screen.queryByText(/seller/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/customer sign in/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Approve\/reject|Upload & manage|Full control/i)).not.toBeInTheDocument()
  })

  it('no longer explains the account model on the customer pages', () => {
    renderWith(<LoginPage />, null)
    expect(screen.queryByText(/No separate buyer or seller registration/i)).not.toBeInTheDocument()
  })

  it('explains a revoked session on the administrator sign-in page', () => {
    renderWith(<AdminLoginPage />, 'revoked')
    expect(screen.getByText('You were signed out')).toBeInTheDocument()
    expect(screen.getByText(/password was changed|signed out on another device/i)).toBeInTheDocument()
  })

  it('does not advertise the administrator sign-in on the customer page', () => {
    renderWith(<LoginPage />, null)
    expect(document.querySelector('a[href="/admin/login"]')).toBeNull()
    expect(screen.queryByText(/administrator/i)).not.toBeInTheDocument()
  })

  it('shows nothing when the visitor simply has no session', () => {
    renderWith(<LoginPage />, null)
    expect(screen.queryByText('Your session expired')).not.toBeInTheDocument()
    expect(screen.queryByText('You were signed out')).not.toBeInTheDocument()
  })
})

describe('failed sign-in feedback', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  const fillAndSubmit = async () => {
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'member@example.com' } })
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'wrong-password-1' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign In' })) })
  }

  it('ties the error to both fields without saying which one was wrong', async () => {
    const loginAccount = vi.fn().mockResolvedValue({ success: false, message: 'Invalid credentials' })
    renderWith(<LoginPage />, null, { loginAccount })
    await fillAndSubmit()
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    for (const field of [screen.getByLabelText('Email address'), screen.getByLabelText('Password', { exact: true })]) {
      expect(field).toHaveAttribute('aria-invalid', 'true')
      expect(field).toHaveAttribute('aria-describedby', 'login-error')
    }
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
  })

  it('when the server asks for a pause, disables the button with a countdown and then lets the person retry', async () => {
    const loginAccount = vi.fn().mockResolvedValue({ success: false, message: 'Too many failed sign-in attempts. Try again in 3 seconds.', retryAfterSeconds: 3 })
    renderWith(<LoginPage />, null, { loginAccount })
    await fillAndSubmit()
    expect(screen.getByRole('alert')).toHaveTextContent('Too many failed sign-in attempts')
    const waiting = screen.getByRole('button', { name: 'Try again in 3 seconds' })
    expect(waiting).toBeDisabled()

    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Try again in 2 seconds' })).toBeDisabled()
    fireEvent.submit(waiting.closest('form'))
    expect(loginAccount).toHaveBeenCalledTimes(1)

    // One tick per act: the next one-second timer is only scheduled after React re-renders.
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Try again in 1 second' })).toBeDisabled()
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps the ordinary error visible when no pause was requested', async () => {
    const loginAccount = vi.fn().mockResolvedValue({ success: false, message: 'Invalid credentials' })
    renderWith(<LoginPage />, null, { loginAccount })
    await fillAndSubmit()
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  })
})
