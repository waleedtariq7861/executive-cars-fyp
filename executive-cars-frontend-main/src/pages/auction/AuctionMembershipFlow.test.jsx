import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionPaymentPage from './AuctionPaymentPage.jsx'
import AuctionPaymentSuccessPage from './AuctionPaymentSuccessPage.jsx'
import AuctionGatePage from './AuctionGatePage.jsx'
import AuctionSignupPage from './AuctionSignupPage.jsx'
import AccountPage from '../AccountPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => auth }))
vi.mock('../../components/Navbar.jsx', () => ({ default: () => null }))
vi.mock('../../components/Footer.jsx', () => ({ default: () => null }))

const inactive = { id: 'member-1', name: 'Demo Customer', email: 'demo@example.com', role: 'user', subscriptionStatus: 'inactive' }
const active = { ...inactive, subscriptionStatus: 'active', subscriptionExpiry: '2099-01-01T00:00:00Z', membershipSource: 'demo', capabilities: { auction: true } }
const capabilities = { activationMode: 'demo', amount: 6200, currency: 'PKR', durationYears: 1, plan: 'annual_auction_membership' }
const auth = { user: inactive, refreshUser: vi.fn(), registerMember: vi.fn(), logout: vi.fn() }

beforeEach(() => {
  vi.resetAllMocks()
  auth.user = inactive
  auth.refreshUser.mockResolvedValue(inactive)
  api.get.mockResolvedValue({ data: capabilities })
})

function payment() {
  return render(<MemoryRouter initialEntries={['/auction/payment']}><Routes>
    <Route path="/auction/payment" element={<AuctionPaymentPage />} />
    <Route path="/auction/payment-success" element={<AuctionPaymentSuccessPage />} />
    <Route path="/auction/dashboard" element={<p>Auction dashboard</p>} />
  </Routes></MemoryRouter>)
}

function success(state) {
  return render(<MemoryRouter initialEntries={[{ pathname: '/auction/payment-success', state }]}><AuctionPaymentSuccessPage /></MemoryRouter>)
}

it('offers no mutation until capability loading completes and displays server plan terms', async () => {
  let resolve
  api.get.mockReturnValue(new Promise(done => { resolve = done }))
  payment()
  expect(screen.getByRole('status')).toHaveTextContent('Checking membership')
  expect(screen.queryByRole('button', { name: 'Activate Demo Membership' })).not.toBeInTheDocument()
  resolve({ data: capabilities })
  await screen.findByRole('button', { name: 'Activate Demo Membership' })
  expect(screen.getByText('PKR 6,200')).toBeInTheDocument()
  expect(api.post).not.toHaveBeenCalled()
})

it('disabled activation has useful navigation and no demo action', async () => {
  api.get.mockResolvedValue({ data: { ...capabilities, activationMode: 'unavailable' } })
  payment()
  await screen.findByText('Membership activation is currently unavailable.')
  expect(screen.queryByRole('button', { name: 'Activate Demo Membership' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account')
  expect(api.post).not.toHaveBeenCalled()
})

it('a failed or invalid capability response can be retried without pretending it is disabled', async () => {
  api.get.mockResolvedValueOnce({ data: { activationMode: 'demo', amount: -1 } })
  payment()
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not check')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  await screen.findByRole('button', { name: 'Activate Demo Membership' })
  expect(api.get).toHaveBeenCalledTimes(2)
})

it('a network failure offers Retry and never offers activation until recovery', async () => {
  api.get.mockRejectedValueOnce(new Error('Network unavailable'))
  payment()
  await screen.findByRole('alert')
  expect(screen.queryByRole('button', { name: 'Activate Demo Membership' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  await screen.findByRole('button', { name: 'Activate Demo Membership' })
  expect(api.post).not.toHaveBeenCalled()
})

it('activates using the existing endpoint and confirms success through the saved server account', async () => {
  api.post.mockResolvedValue({ data: { memberId: active.id, subscriptionStatus: 'active', paymentMode: 'demo' } })
  auth.refreshUser.mockResolvedValue(active)
  payment()
  fireEvent.click(await screen.findByRole('button', { name: 'Activate Demo Membership' }))
  expect(await screen.findByRole('heading', { name: 'Demo Auction Access Activated' })).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledWith('/payments/demo-complete')
  expect(auth.refreshUser).toHaveBeenCalledTimes(1)
  expect(screen.getByText(/No charge, receipt, or settlement/)).toBeInTheDocument()
})

it('prevents repeat clicks while activation is pending', async () => {
  api.post.mockReturnValue(new Promise(() => {}))
  payment()
  const button = await screen.findByRole('button', { name: 'Activate Demo Membership' })
  fireEvent.click(button)
  expect(button).toBeDisabled()
  fireEvent.click(button)
  expect(api.post).toHaveBeenCalledTimes(1)
})

it('recovers a lost activation response by checking membership without sending another POST', async () => {
  api.post.mockRejectedValue(new Error('Request timed out'))
  auth.refreshUser.mockResolvedValue(active)
  payment()
  fireEvent.click(await screen.findByRole('button', { name: 'Activate Demo Membership' }))
  await screen.findByRole('heading', { name: 'Your Auction Membership Is Active' })
  expect(api.post).toHaveBeenCalledTimes(1)
})

it('shows an activation failure when a status check confirms the account is still inactive', async () => {
  api.post.mockRejectedValue(new Error('Could not activate membership'))
  payment()
  fireEvent.click(await screen.findByRole('button', { name: 'Activate Demo Membership' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not activate membership')
  expect(screen.getByRole('button', { name: 'Activate Demo Membership' })).toBeEnabled()
  expect(screen.queryByRole('link', { name: 'View Auctions' })).not.toBeInTheDocument()
})

it.each(['demo', 'unavailable'])('new customer signup continues according to %s availability', async mode => {
  auth.user = null
  auth.registerMember.mockResolvedValue({ success: true })
  api.get.mockResolvedValue({ data: { ...capabilities, activationMode: mode } })
  render(<MemoryRouter initialEntries={['/auction/signup']}><Routes>
    <Route path="/auction/signup" element={<AuctionSignupPage />} />
    <Route path="/auction/payment" element={<p>Membership step</p>} />
    <Route path="/account" element={<p>Unified account</p>} />
  </Routes></MemoryRouter>)
  const submit = await screen.findByRole('button', { name: mode === 'demo' ? 'Create Account and Continue to Demo' : 'Create Account' })
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Customer' } })
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@example.com' } })
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+923001234567' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'test-pass-123' } })
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'test-pass-123' } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(submit)
  await screen.findByText(mode === 'demo' ? 'Membership step' : 'Unified account')
  expect(auth.registerMember).toHaveBeenCalledWith('New Customer', 'new@example.com', '+923001234567', 'test-pass-123')
})

it('rechecks capabilities when activation becomes unavailable between load and click', async () => {
  api.post.mockRejectedValue({ response: { status: 404, data: { code: 'MEMBERSHIP_UNAVAILABLE', message: 'Membership activation is currently unavailable.' } } })
  payment()
  await screen.findByRole('button', { name: 'Activate Demo Membership' })
  api.get.mockResolvedValue({ data: { ...capabilities, activationMode: 'unavailable' } })
  fireEvent.click(screen.getByRole('button', { name: 'Activate Demo Membership' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Activate Demo Membership' })).not.toBeInTheDocument())
  expect(api.get).toHaveBeenCalledTimes(2)
})

it('does not grant success from navigation state when saved membership is inactive', async () => {
  success({ membership: { memberId: inactive.id, subscriptionStatus: 'active', paymentMode: 'demo' } })
  await screen.findByRole('heading', { name: 'Membership is not active' })
  expect(screen.queryByRole('link', { name: 'View Auctions' })).not.toBeInTheDocument()
})

it('direct success-page entry displays saved active status without claiming a new activation', async () => {
  auth.refreshUser.mockResolvedValue(active)
  success()
  await screen.findByRole('heading', { name: 'Your Auction Membership Is Active' })
  expect(screen.getByRole('link', { name: 'View Auctions' })).toHaveAttribute('href', '/auction/dashboard')
})

it('failed membership confirmation offers a status retry', async () => {
  auth.refreshUser.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(active)
  success()
  fireEvent.click(await screen.findByRole('button', { name: 'Retry status check' }))
  await screen.findByRole('heading', { name: 'Your Auction Membership Is Active' })
})

it('existing active customers retain auction access without waiting for activation capabilities', () => {
  auth.user = active
  payment()
  expect(screen.getByText('Auction dashboard')).toBeInTheDocument()
  expect(api.get).not.toHaveBeenCalled()
})

it.each([['account', AccountPage], ['gate', AuctionGatePage], ['signup', AuctionSignupPage]])('%s entry agrees with disabled capability', async (_name, Page) => {
  api.get.mockResolvedValue({ data: { ...capabilities, activationMode: 'unavailable' } })
  render(<MemoryRouter><Page /></MemoryRouter>)
  await screen.findByText('Membership activation is currently unavailable.')
  expect(screen.queryByText('Secure Payments')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Activate demo membership|Continue to Demo Activation/i })).not.toBeInTheDocument()
})
