import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { AuthContext } from '../context/authContext.js'
import VerifyEmailPage from './VerifyEmailPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const unverified = { id: 'm1', name: 'New Customer', email: 'new@example.com', role: 'user', emailVerified: false }
const refreshUser = vi.fn()

function Landing() {
  const location = useLocation()
  return <p>Landed on {location.pathname}</p>
}

const renderPage = ({ state, user = unverified } = {}) => render(
  <AuthContext.Provider value={{ user, refreshUser }}>
    <MemoryRouter initialEntries={[{ pathname: '/verify-email', state }]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/account" element={<Landing />} />
        <Route path="/auction/payment" element={<Landing />} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>,
)
const typeCode = value => fireEvent.change(screen.getByLabelText(/Verification code/), { target: { value } })
const verifyClick = async () => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Verify email' })) }) }

beforeEach(() => {
  api.post.mockReset()
  refreshUser.mockReset().mockResolvedValue({ ...unverified, emailVerified: true })
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => vi.useRealTimers())

describe('VerifyEmailPage', () => {
  it('after sign-up says where the code went and makes the first resend wait out the minute', () => {
    renderPage({ state: { next: '/account', verification: { sent: true, delivery: 'email', expiresInSeconds: 600 } } })
    expect(screen.getByText('new@example.com')).toBeInTheDocument()
    expect(screen.getByText(/valid for 10 minutes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send a new code in 60 seconds' })).toBeDisabled()
  })

  it('says plainly when the sign-up code could not be sent and lets the customer ask again', async () => {
    renderPage({ state: { verification: { sent: false, failed: true } } })
    expect(screen.getByRole('alert')).toHaveTextContent('We could not send the code')
    api.post.mockResolvedValueOnce({ data: { sent: true, delivery: 'email' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Send code' })) })
    expect(api.post).toHaveBeenCalledWith('/auth/email/send-code')
    expect(screen.getByText(/We sent a new code to new@example.com/)).toBeInTheDocument()
    // The next resend has to wait out the minute the server enforces.
    expect(screen.getByRole('button', { name: 'Send a new code in 60 seconds' })).toBeDisabled()
  })

  it('shows the on-screen code only when the server returns one (local delivery)', () => {
    renderPage({ state: { verification: { sent: true, delivery: 'development', devCode: '042917' } } })
    expect(screen.getByText('Local delivery')).toBeInTheDocument()
    expect(screen.getByText('042917')).toBeInTheDocument()
  })

  it('offers to send a first code when the page is opened directly', () => {
    renderPage()
    expect(screen.getByText(/Send a 6-digit code to/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
  })

  it('keeps only digits and spaces in the code field', () => {
    renderPage()
    typeCode('12a3-4 56')
    expect(screen.getByLabelText(/Verification code/)).toHaveValue('1234 56')
  })

  it('checks the format before contacting the server and links the error to the field', async () => {
    renderPage()
    typeCode('123')
    await verifyClick()
    expect(api.post).not.toHaveBeenCalled()
    const field = screen.getByLabelText(/Verification code/)
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the 6-digit code.')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field.getAttribute('aria-describedby')).toContain('verification-code-error')
  })

  it('verifies, refreshes the account and moves on to where the customer was going', async () => {
    api.post.mockResolvedValueOnce({ data: { verified: true } })
    renderPage({ state: { next: '/auction/payment', verification: { sent: true } } })
    typeCode('123 456')
    await verifyClick()
    expect(api.post).toHaveBeenCalledWith('/auth/email/verify', { code: '123456' })
    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Landed on /auction/payment')).toBeInTheDocument()
  })

  it('ignores a destination that is not a path on this site', async () => {
    api.post.mockResolvedValueOnce({ data: { verified: true } })
    renderPage({ state: { next: '//evil.example.com' } })
    typeCode('123456')
    await verifyClick()
    expect(screen.getByText('Landed on /account')).toBeInTheDocument()
  })

  it('shows the server\'s reason next to the field and keeps the code for another try when it was only wrong', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { code: 'CODE_INCORRECT', message: 'That code is not correct.', errors: { code: 'That code is not correct.' }, remainingAttempts: 4 } } })
    renderPage()
    typeCode('123456')
    await verifyClick()
    expect(screen.getByRole('alert')).toHaveTextContent('That code is not correct.')
    expect(screen.getByLabelText(/Verification code/)).toHaveValue('123456')
    expect(refreshUser).not.toHaveBeenCalled()
  })

  it.each(['TOO_MANY_ATTEMPTS', 'CODE_EXPIRED', 'NO_CODE'])('clears the field when the code is no longer usable (%s)', async reason => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { code: reason, message: 'Ask for a new code.', errors: { code: 'Ask for a new code.' } } } })
    renderPage()
    typeCode('123456')
    await verifyClick()
    expect(screen.getByLabelText(/Verification code/)).toHaveValue('')
    expect(screen.getByRole('alert')).toHaveTextContent('Ask for a new code.')
  })

  it('counts down the wait the server asks for when a new code is requested too soon', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 429, data: { code: 'RESEND_TOO_SOON', message: 'Please wait a moment before asking for another code.', retryAfterSeconds: 2 }, headers: { 'retry-after': '2' } } })
    renderPage()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Send code' })) })
    expect(screen.getByRole('alert')).toHaveTextContent('Please wait a moment')
    expect(screen.getByRole('button', { name: 'Send a new code in 2 seconds' })).toBeDisabled()
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
  })

  it('reports a failed send without pretending it worked', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 502, data: { code: 'EMAIL_SEND_FAILED', message: 'We could not send the code. Please try again in a moment.' } } })
    renderPage()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Send code' })) })
    expect(screen.getByRole('alert')).toHaveTextContent('We could not send the code')
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
  })

  it('lets the customer carry on without verifying', () => {
    renderPage({ state: { next: '/auction/payment' } })
    expect(screen.getByRole('link', { name: 'Verify later' })).toHaveAttribute('href', '/auction/payment')
  })

  it('tells an already verified customer so and offers to continue', () => {
    renderPage({ user: { ...unverified, emailVerified: true }, state: { next: '/auction/payment' } })
    expect(screen.getByRole('heading', { name: 'Email verified' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/auction/payment')
    expect(screen.queryByLabelText(/Verification code/)).not.toBeInTheDocument()
  })
})
