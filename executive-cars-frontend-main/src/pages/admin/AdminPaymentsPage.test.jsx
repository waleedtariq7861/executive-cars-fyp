import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AdminPaymentsPage from './AdminPaymentsPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'a1', role: 'admin', name: 'Admin' }, logout: vi.fn() }) }))

const base = { amount: 4999, currency: 'PKR', createdAt: '2026-11-10T10:00:00Z', description: 'Annual Auction Membership (1 year)' }
const pending = { ...base, id: 'p2', reference: 'EC-PAY-0000000002', status: 'pending_verification', method: 'bank_transfer', methodLabel: 'Bank transfer, transaction TXN-784512', bankReference: 'TXN-784512', transferDate: '2026-11-09T00:00:00Z', member: { id: 'm2', name: 'Pending Customer', email: 'pending@example.com' } }
const paid = { ...base, id: 'p1', reference: 'EC-PAY-0000000001', status: 'succeeded', methodLabel: 'Visa ending 4242', invoiceNumber: 'EC-INV-2026-000001', paidAt: '2026-11-10T10:05:00Z', member: { id: 'm1', name: 'Paid Customer', email: 'paid@example.com' } }
const summary = { succeededCount: 1, succeededTotal: 4999, pendingVerification: 1, currency: 'PKR' }

const renderPage = () => render(<MemoryRouter><AdminPaymentsPage /></MemoryRouter>)

beforeEach(() => {
  vi.resetAllMocks()
  api.get.mockResolvedValue({ data: { payments: [pending, paid], summary } })
  api.post.mockResolvedValue({ data: {} })
})

describe('AdminPaymentsPage', () => {
  it('shows the totals and every payment with its customer, method, status and invoice', async () => {
    renderPage()
    expect(await screen.findByText('Pending Customer')).toBeInTheDocument()
    expect(screen.getByText('Total received').nextSibling).toHaveTextContent('PKR 4,999')
    expect(screen.getByText('Awaiting confirmation', { selector: 'p' }).nextSibling).toHaveTextContent('1')
    expect(screen.getByText('EC-INV-2026-000001')).toBeInTheDocument()
    expect(screen.getByText('paid@example.com')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/admin/payments', { params: {} })
  })

  it('offers confirm and reject only for a transfer that is waiting', async () => {
    renderPage()
    await screen.findByText('Pending Customer')
    expect(screen.getByRole('button', { name: 'Confirm payment EC-PAY-0000000002' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject payment EC-PAY-0000000002' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /EC-PAY-0000000001/ })).not.toBeInTheDocument()
  })

  it('filters by status through the server', async () => {
    renderPage()
    await screen.findByText('Pending Customer')
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'pending_verification' } })
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/admin/payments', { params: { status: 'pending_verification' } }))
  })

  it('confirming asks first, then calls the server and reloads', async () => {
    renderPage()
    await screen.findByText('Pending Customer')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment EC-PAY-0000000002' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/transaction TXN-784512/)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm payment' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/payments/p2/confirm', {}))
    expect(await screen.findByText(/Payment EC-PAY-0000000002 confirmed/)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('rejecting sends the reason the administrator typed', async () => {
    renderPage()
    await screen.findByText('Pending Customer')
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment EC-PAY-0000000002' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason shown to the customer'), { target: { value: 'No deposit found.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject payment' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/payments/p2/reject', { reason: 'No deposit found.' }))
  })

  it('reports a failed action and closes the dialog instead of hiding the message behind it', async () => {
    api.post.mockRejectedValue({ response: { status: 409, data: { message: 'The customer already has an active membership.' } } })
    renderPage()
    await screen.findByText('Pending Customer')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment EC-PAY-0000000002' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm payment' }))
    expect(await screen.findByText('The customer already has an active membership.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('says when payments cannot be loaded and when there are none', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Payments could not be loaded.' } } })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Payments could not be loaded.')
    api.get.mockResolvedValueOnce({ data: { payments: [], summary: { ...summary, succeededCount: 0, succeededTotal: 0, pendingVerification: 0 } } })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No payments found')).toBeInTheDocument()
  })
})
