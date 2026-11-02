import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionPaymentPage from './AuctionPaymentPage.jsx'
import AuctionPaymentSuccessPage from './AuctionPaymentSuccessPage.jsx'
import AuctionGatePage from './AuctionGatePage.jsx'
import AccountPage from '../AccountPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => auth }))
vi.mock('../../components/Navbar.jsx', () => ({ default: () => null }))
vi.mock('../../components/Footer.jsx', () => ({ default: () => null }))

const inactive = { id: 'member-1', name: 'Test Customer', email: 'customer@example.com', role: 'user', subscriptionStatus: 'inactive', emailVerified: true }
const active = { ...inactive, subscriptionStatus: 'active', subscriptionExpiry: '2099-01-01T00:00:00Z', membershipSource: 'payment', capabilities: { auction: true } }
const plan = { id: 'annual_auction_membership', name: 'Annual Auction Membership', amount: 6200, currency: 'PKR', durationYears: 1, provider: 'sandbox' }
const methodsResponse = {
  provider: 'sandbox',
  methods: [
    { id: 'card', label: 'Debit / credit card', instant: true, testHint: 'Test card 4242 4242 4242 4242, any future expiry, any 3-digit code.' },
    { id: 'wallet', label: 'JazzCash / Easypaisa', instant: true, testHint: 'Test wallet number 03000000001.' },
    { id: 'bank_transfer', label: 'Bank transfer', instant: false, testHint: 'Confirmed by an administrator after you submit the transaction ID.' },
  ],
  wallets: [{ id: 'jazzcash', label: 'JazzCash' }, { id: 'easypaisa', label: 'Easypaisa' }],
  bank: { bankName: 'Sandbox Bank Ltd', accountTitle: 'Executive Cars (Sandbox)', iban: 'PK00SBOX0000000000000001' },
}
const open = { id: 'pay-1', reference: 'EC-PAY-AAAAAAAAAA', status: 'requires_payment', amount: 6200, currency: 'PKR' }
const paid = { ...open, status: 'succeeded', methodLabel: 'Visa ending 4242', invoiceNumber: 'EC-INV-2026-000001' }
const auth = { user: inactive, refreshUser: vi.fn(), logout: vi.fn() }
const year = String((new Date().getFullYear() + 2) % 100).padStart(2, '0')

const respond = (overrides = {}) => api.get.mockImplementation(url => {
  if (url === '/payments/plan') return overrides.plan ?? Promise.resolve({ data: plan })
  if (url === '/payments/methods') return overrides.methods ?? Promise.resolve({ data: methodsResponse })
  return Promise.reject(new Error(`unexpected GET ${url}`))
})

function Landing() {
  const location = useLocation()
  return <p>success page for {location.state?.invoiceNumber}</p>
}

beforeEach(() => {
  vi.resetAllMocks()
  auth.user = inactive
  auth.refreshUser.mockResolvedValue(active)
  respond()
  api.post.mockImplementation(url => (url === '/payments' ? Promise.resolve({ data: { payment: open }, status: 201 }) : Promise.reject(new Error(`unexpected POST ${url}`))))
})

function checkout(entry = '/auction/payment') {
  return render(<MemoryRouter initialEntries={[entry]}><Routes>
    <Route path="/auction/payment" element={<AuctionPaymentPage />} />
    <Route path="/auction/payment-success" element={<Landing />} />
    <Route path="/auction/dashboard" element={<p>Auction dashboard</p>} />
    <Route path="/verify-email" element={<p>Verify your email page</p>} />
  </Routes></MemoryRouter>)
}
const fillCard = (values = {}) => {
  const card = { 'Name on card': 'Test Customer', 'Card number': '4242424242424242', Expiry: `12${year}`, 'Security code': '123', ...values }
  for (const [label, value] of Object.entries(card)) fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } })
}
const submit = name => fireEvent.click(screen.getByRole('button', { name }))
const payButton = /^Pay PKR 6,200$/

it('shows the server price, the sandbox notice and opens one payment record when the page opens', async () => {
  checkout()
  expect(await screen.findByRole('button', { name: payButton })).toBeInTheDocument()
  const summary = screen.getByRole('region', { name: 'Order summary' })
  expect(within(summary).getByText('Annual Auction Membership')).toBeInTheDocument()
  expect(within(summary).getAllByText('PKR 6,200').length).toBeGreaterThan(0)
  expect(within(summary).getByText('EC-PAY-AAAAAAAAAA')).toBeInTheDocument()
  expect(screen.getByText(/Sandbox mode\./)).toBeInTheDocument()
  expect(screen.getByText(/real card or wallet number is refused/)).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledTimes(1)
  expect(api.post).toHaveBeenCalledWith('/payments')
})

it('pays by card: digits only go to the server and the success page gets the invoice', async () => {
  api.post.mockImplementation(url => (url === '/payments' ? Promise.resolve({ data: { payment: open }, status: 201 })
    : Promise.resolve({ data: { payment: paid, invoiceNumber: paid.invoiceNumber }, status: 201 })))
  checkout()
  await screen.findByRole('button', { name: payButton })
  fillCard({ 'Card number': '4242 4242 4242 4242' })
  expect(screen.getByLabelText(/^Card number/)).toHaveValue('4242 4242 4242 4242')
  submit(payButton)
  expect(await screen.findByText('success page for EC-INV-2026-000001')).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledWith('/payments/pay-1/pay', {
    method: 'card', card: { name: 'Test Customer', number: '4242424242424242', expMonth: 12, expYear: 2000 + Number(year), cvc: '123' },
  })
  // The account is re-read by the success page, not here: refreshing first would trigger the already-a-member redirect.
  expect(auth.refreshUser).not.toHaveBeenCalled()
})

it('checks the card on the page first, shows field errors and sends nothing', async () => {
  checkout()
  await screen.findByRole('button', { name: payButton })
  fillCard({ 'Card number': '4242 4242 4242 4241', Expiry: '0120', 'Security code': '1', 'Name on card': '' })
  submit(payButton)
  expect(await screen.findByText('Enter a valid card number.')).toBeInTheDocument()
  expect(screen.getByText('This card has expired.')).toBeInTheDocument()
  expect(screen.getByText('Enter the 3-digit security code.')).toBeInTheDocument()
  expect(screen.getByText('Enter the name on the card.')).toBeInTheDocument()
  expect(screen.getByLabelText(/^Card number/)).toHaveAttribute('aria-invalid', 'true')
  expect(api.post).toHaveBeenCalledTimes(1)
})

it('formats the card number and expiry as they are typed and names the card brand', async () => {
  checkout()
  await screen.findByRole('button', { name: payButton })
  fireEvent.change(screen.getByLabelText(/^Card number/), { target: { value: '4242-4242 4242abcd4242' } })
  expect(screen.getByLabelText(/^Card number/)).toHaveValue('4242 4242 4242 4242')
  expect(screen.getByText('Visa')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText(/^Expiry/), { target: { value: '1227' } })
  expect(screen.getByLabelText(/^Expiry/)).toHaveValue('12 / 27')
})

it('shows the provider\'s refusal of a real card next to the card number and keeps the form', async () => {
  api.post.mockImplementation(url => (url === '/payments' ? Promise.resolve({ data: { payment: open }, status: 201 })
    : Promise.reject({ response: { status: 400, data: { code: 'NOT_A_TEST_CARD', message: 'This is a sandbox: only test cards are accepted.', errors: { cardNumber: 'This is a sandbox: only test cards are accepted.' } } } })))
  checkout()
  await screen.findByRole('button', { name: payButton })
  fillCard({ 'Card number': '4111111111111111' })
  submit(payButton)
  expect(await screen.findByText('This is a sandbox: only test cards are accepted.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: payButton })).toBeEnabled()
  expect(api.post).toHaveBeenCalledTimes(2)
})

it('a declined payment is reported and a fresh payment is opened so another try or method works', async () => {
  let created = 0
  api.post.mockImplementation(url => {
    if (url === '/payments') { created += 1; return Promise.resolve({ data: { payment: { ...open, id: `pay-${created}` } }, status: 201 }) }
    return Promise.reject({ response: { status: 402, data: { code: 'CARD_DECLINED', message: 'The card was declined by the bank.' } } })
  })
  checkout()
  await screen.findByRole('button', { name: payButton })
  fillCard()
  submit(payButton)
  expect(await screen.findByText('The card was declined by the bank.')).toBeInTheDocument()
  await waitFor(() => expect(created).toBe(2))
  expect(screen.getByLabelText(/^Security code/)).toHaveValue('')
  expect(screen.getByRole('button', { name: payButton })).toBeEnabled()
})

it('pays with a wallet', async () => {
  api.post.mockImplementation(url => (url === '/payments' ? Promise.resolve({ data: { payment: open }, status: 201 })
    : Promise.resolve({ data: { payment: { ...paid, methodLabel: 'JazzCash 0300•••••01' }, invoiceNumber: paid.invoiceNumber }, status: 201 })))
  checkout()
  await screen.findByRole('button', { name: payButton })
  fireEvent.click(screen.getByLabelText(/JazzCash \/ Easypaisa/))
  expect(screen.getByText(/Test wallet number 03000000001/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText(/^Wallet mobile number/), { target: { value: '0300-0000001' } })
  expect(screen.getByLabelText(/^Wallet mobile number/)).toHaveValue('03000000001')
  submit(payButton)
  expect(await screen.findByText('success page for EC-INV-2026-000001')).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledWith('/payments/pay-1/pay', { method: 'wallet', wallet: { provider: 'jazzcash', number: '03000000001' } })
})

it('checks the wallet number before sending', async () => {
  checkout()
  await screen.findByRole('button', { name: payButton })
  fireEvent.click(screen.getByLabelText(/JazzCash \/ Easypaisa/))
  fireEvent.change(screen.getByLabelText(/^Wallet mobile number/), { target: { value: '123' } })
  submit(payButton)
  expect(await screen.findByText(/Enter the 11-digit mobile number/)).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledTimes(1)
})

it('bank transfer: shows the account and the payment reference, submits the transaction id and then waits for confirmation', async () => {
  api.post.mockImplementation(url => (url === '/payments' ? Promise.resolve({ data: { payment: open }, status: 201 })
    : Promise.resolve({ data: { payment: { ...open, status: 'pending_verification', bankReference: 'TXN-784512' } }, status: 202 })))
  checkout()
  await screen.findByRole('button', { name: payButton })
  fireEvent.click(screen.getByLabelText(/Bank transfer/))
  const details = screen.getByLabelText('Bank details')
  expect(within(details).getByText('PK00SBOX0000000000000001')).toBeInTheDocument()
  expect(within(details).getByText('EC-PAY-AAAAAAAAAA')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText(/^Transaction ID/), { target: { value: 'TXN-784512' } })
  submit('Submit transfer details')
  expect(await screen.findByText('Waiting for confirmation')).toBeInTheDocument()
  expect(screen.getByText(/transaction TXN-784512/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Submit transfer details' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View my payments' })).toHaveAttribute('href', '/account/payments')
})

it('checks the transaction id before sending a bank transfer', async () => {
  checkout()
  await screen.findByRole('button', { name: payButton })
  fireEvent.click(screen.getByLabelText(/Bank transfer/))
  submit('Submit transfer details')
  expect(await screen.findByText(/Enter the transaction ID from your bank/)).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledTimes(1)
})

it('opening the page while a transfer is already waiting shows that instead of a form', async () => {
  api.post.mockRejectedValueOnce({ response: { status: 409, data: { code: 'PAYMENT_PENDING_VERIFICATION', message: 'Your bank transfer is waiting to be confirmed.', payment: { ...open, status: 'pending_verification', bankReference: 'TXN-111111' } } } })
  checkout()
  expect(await screen.findByText('Waiting for confirmation')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: payButton })).not.toBeInTheDocument()
})

it('an unverified email sends the customer to the code page instead of failing silently', async () => {
  api.post.mockRejectedValueOnce({ response: { status: 403, data: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email address to continue.' } } })
  checkout()
  const link = await screen.findByRole('link', { name: 'Verify your email' })
  expect(link).toHaveAttribute('href', '/verify-email')
})

it('a payment that could not be started offers a retry that starts it again', async () => {
  api.post.mockRejectedValueOnce({ response: { status: 500, data: { message: 'We could not start the payment.' } } })
  checkout()
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('button', { name: payButton })).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledTimes(2)
})

it('a plan that cannot be loaded says so and can be retried', async () => {
  respond({ plan: Promise.reject(new Error('Network unavailable')) })
  checkout()
  const retry = await screen.findByRole('button', { name: 'Try again' })
  respond()
  fireEvent.click(retry)
  expect((await screen.findAllByText('PKR 6,200')).length).toBeGreaterThan(0)
})

it('prevents a second submit while the payment is being processed', async () => {
  let release
  api.post.mockImplementation(url => (url === '/payments' ? Promise.resolve({ data: { payment: open }, status: 201 })
    : new Promise(resolve => { release = () => resolve({ data: { payment: paid, invoiceNumber: paid.invoiceNumber }, status: 201 }) })))
  checkout()
  await screen.findByRole('button', { name: payButton })
  fillCard()
  fireEvent.submit(screen.getByRole('button', { name: payButton }).closest('form'))
  fireEvent.submit(screen.getByRole('button', { name: payButton }).closest('form'))
  expect(api.post.mock.calls.filter(([url]) => url.endsWith('/pay'))).toHaveLength(1)
  release()
  await screen.findByText('success page for EC-INV-2026-000001')
})

it('a customer who already has an active membership goes straight to the dashboard without any payment request', () => {
  auth.user = active
  checkout()
  expect(screen.getByText('Auction dashboard')).toBeInTheDocument()
  expect(api.post).not.toHaveBeenCalled()
  expect(api.get).not.toHaveBeenCalled()
})

it('an unverified customer sees the verification reminder on the payment page', async () => {
  auth.user = { ...inactive, emailVerified: false }
  checkout()
  await screen.findByRole('button', { name: payButton })
  expect(screen.getByRole('link', { name: 'Verify email' })).toHaveAttribute('href', '/verify-email')
})

function success(state) {
  return render(<MemoryRouter initialEntries={[{ pathname: '/auction/payment-success', state }]}><AuctionPaymentSuccessPage /></MemoryRouter>)
}

it('the success page confirms through the saved account and links the invoice', async () => {
  auth.refreshUser.mockResolvedValue(active)
  success({ payment: paid, invoiceNumber: paid.invoiceNumber })
  expect(await screen.findByRole('heading', { name: 'Payment successful' })).toBeInTheDocument()
  expect(screen.getByText('EC-INV-2026-000001')).toBeInTheDocument()
  expect(screen.getByText('Visa ending 4242')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View invoice' })).toHaveAttribute('href', '/account/payments/pay-1/invoice')
  expect(screen.getByRole('link', { name: 'View Auctions' })).toHaveAttribute('href', '/auction/dashboard')
})

it('the success page does not grant success from navigation state when the saved membership is inactive', async () => {
  auth.refreshUser.mockResolvedValue(inactive)
  success({ payment: paid, invoiceNumber: paid.invoiceNumber })
  await screen.findByRole('heading', { name: 'Membership is not active' })
  expect(screen.queryByRole('link', { name: 'View invoice' })).not.toBeInTheDocument()
  expect(screen.queryByText('EC-INV-2026-000001')).not.toBeInTheDocument()
})

it('direct entry to the success page shows the saved status without claiming a new payment', async () => {
  auth.refreshUser.mockResolvedValue(active)
  success()
  await screen.findByRole('heading', { name: 'Your Auction Membership Is Active' })
  expect(screen.queryByRole('link', { name: 'View invoice' })).not.toBeInTheDocument()
})

it('a failed membership confirmation offers a status retry', async () => {
  auth.refreshUser.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(active)
  success()
  fireEvent.click(await screen.findByRole('button', { name: 'Retry status check' }))
  await screen.findByRole('heading', { name: 'Your Auction Membership Is Active' })
})

it('the gate and the account page point to the payment page and show the price', async () => {
  render(<MemoryRouter><AuctionGatePage /></MemoryRouter>)
  expect(await screen.findByText(/Annual Auction Membership: PKR 6,200 for 1 year/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Get Membership' })).toHaveAttribute('href', '/auction/payment')
  render(<MemoryRouter><AccountPage /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /Get membership/ })).toHaveAttribute('href', '/auction/payment')
  expect(screen.getByRole('link', { name: /My payments/ })).toHaveAttribute('href', '/account/payments')
})
