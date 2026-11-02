import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLoginPage from './AdminLoginPage.jsx'

const { loginAdmin, completeAdminMfa } = vi.hoisted(() => ({ loginAdmin: vi.fn(), completeAdminMfa: vi.fn() }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ loginAdmin, completeAdminMfa }) }))

const renderPage = () => render(
  <MemoryRouter initialEntries={['/admin/login']}>
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<div>Admin dashboard opened</div>} />
    </Routes>
  </MemoryRouter>,
)
const passwordStep = async () => {
  loginAdmin.mockResolvedValue({ success: false, mfaRequired: true, challenge: 'challenge-token-abcdefghijklmnop', expiresInSeconds: 300 })
  renderPage()
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'admin@test.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin-pass-123' } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i })) })
}
const enterCode = async value => {
  fireEvent.change(screen.getByLabelText('Authenticator code'), { target: { value } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /verify and sign in|try again in/i })) })
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

describe('administrator sign-in with a second step', () => {
  it('moves to the code step after the password and never reaches the dashboard without the code', async () => {
    await passwordStep()
    expect(screen.getByRole('heading', { name: 'Two-step sign-in' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin dashboard opened')).not.toBeInTheDocument()
    expect(screen.getByText(/Type one of your recovery codes instead/)).toBeInTheDocument()
  })

  it('sends the challenge with the code and opens the dashboard', async () => {
    await passwordStep()
    completeAdminMfa.mockResolvedValue({ success: true, role: 'admin' })
    await enterCode('123456')
    expect(completeAdminMfa).toHaveBeenCalledWith('challenge-token-abcdefghijklmnop', '123456')
    expect(await screen.findByText('Admin dashboard opened')).toBeInTheDocument()
  })

  it('accepts a recovery code in the same field', async () => {
    await passwordStep()
    completeAdminMfa.mockResolvedValue({ success: true, role: 'admin' })
    await enterCode('abcde-fghjk')
    expect(completeAdminMfa).toHaveBeenCalledWith('challenge-token-abcdefghijklmnop', 'abcde-fghjk')
  })

  it('asks for a code before contacting the server', async () => {
    await passwordStep()
    await enterCode('   ')
    expect(completeAdminMfa).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the code from your authenticator app.')
  })

  it('shows a wrong code, clears the field and lets the person try again', async () => {
    await passwordStep()
    completeAdminMfa.mockResolvedValueOnce({ success: false, code: 'MFA_CODE_INVALID', message: 'That code is incorrect or has already been used.', fieldErrors: { code: 'That code is incorrect or has already been used.' } })
    await enterCode('000000')
    expect(screen.getByRole('alert')).toHaveTextContent('That code is incorrect or has already been used.')
    expect(screen.getByLabelText('Authenticator code')).toHaveValue('')
    completeAdminMfa.mockResolvedValueOnce({ success: true, role: 'admin' })
    await enterCode('654321')
    expect(await screen.findByText('Admin dashboard opened')).toBeInTheDocument()
  })

  it('goes back to the password step with the reason when the sign-in has expired', async () => {
    await passwordStep()
    completeAdminMfa.mockResolvedValue({ success: false, code: 'MFA_CHALLENGE_INVALID', message: 'This sign-in has expired. Enter your email and password again.', fieldErrors: {} })
    await enterCode('123456')
    expect(screen.getByRole('alert')).toHaveTextContent('This sign-in has expired. Enter your email and password again.')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('Email Address')).toHaveValue('admin@test.com')
  })

  it('pauses with a countdown when the account is being slowed down', async () => {
    await passwordStep()
    completeAdminMfa.mockResolvedValue({ success: false, code: 'LOGIN_THROTTLED', message: 'Too many failed sign-in attempts. Try again in 2 seconds.', retryAfterSeconds: 2, fieldErrors: {} })
    await enterCode('123456')
    const waiting = screen.getByRole('button', { name: 'Try again in 2 seconds' })
    expect(waiting).toBeDisabled()
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: /verify and sign in/i })).toBeEnabled()
  })

  it('can go back to use a different account', async () => {
    await passwordStep()
    fireEvent.click(screen.getByRole('button', { name: 'Use a different account' }))
    expect(screen.getByRole('heading', { name: 'Admin Login' })).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('still signs in straight away when the account has no second step', async () => {
    loginAdmin.mockResolvedValue({ success: true, role: 'admin' })
    renderPage()
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'admin@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin-pass-123' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i })) })
    expect(await screen.findByText('Admin dashboard opened')).toBeInTheDocument()
    expect(completeAdminMfa).not.toHaveBeenCalled()
  })
})
