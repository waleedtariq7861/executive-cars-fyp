import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { AuthContext } from '../context/authContext.js'
import AccountSignupPage from './AccountSignupPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const registerAccount = vi.fn()

function VerifyStub() {
  const location = useLocation()
  return <p>verify next={location.state?.next} sent={String(location.state?.verification?.sent)}</p>
}

const renderSignup = (entry = '/signup') => render(
  <AuthContext.Provider value={{ user: null, registerAccount }}>
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/signup" element={<AccountSignupPage />} />
        <Route path="/verify-email" element={<VerifyStub />} />
        <Route path="/account" element={<p>account page</p>} />
        <Route path="/auction/payment" element={<p>membership step</p>} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>,
)

const signUp = async () => {
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Customer' } })
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@example.com' } })
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+923001234567' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'orchid-lantern-42' } })
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'orchid-lantern-42' } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
}

beforeEach(() => {
  registerAccount.mockReset()
  api.get.mockReset().mockResolvedValue({ data: { activationMode: 'demo', amount: 4999, currency: 'PKR', durationYears: 1, plan: 'annual_auction_membership' } })
})

describe('AccountSignupPage after registration', () => {
  it('sends a new customer to the code screen with what the server said about the code', async () => {
    registerAccount.mockResolvedValue({ success: true, verification: { sent: true, delivery: 'email' } })
    renderSignup()
    await signUp()
    expect(await screen.findByText('verify next=/account sent=true')).toBeInTheDocument()
  })

  it('carries the auction intent through the code screen to the membership step', async () => {
    registerAccount.mockResolvedValue({ success: true, verification: { sent: false, failed: true } })
    renderSignup('/signup?next=auction')
    await waitFor(() => expect(api.get).toHaveBeenCalled())
    await screen.findByRole('button', { name: /Create Account and Continue to Demo/ })
    await signUp()
    expect(await screen.findByText('verify next=/auction/payment sent=false')).toBeInTheDocument()
  })

  it('goes straight on when the server did not issue a code (older backend)', async () => {
    registerAccount.mockResolvedValue({ success: true })
    renderSignup()
    await signUp()
    expect(await screen.findByText('account page')).toBeInTheDocument()
  })
})
