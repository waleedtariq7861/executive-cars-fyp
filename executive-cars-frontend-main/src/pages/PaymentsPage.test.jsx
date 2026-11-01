import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import PaymentsPage from './PaymentsPage.jsx'
import InvoicePage from './InvoicePage.jsx'
import { Route, Routes } from 'react-router-dom'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../components/Navbar.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))

const base = { description: 'Annual Auction Membership (1 year)', amount: 4999, currency: 'PKR', createdAt: '2026-11-10T10:00:00Z' }
const payments = [
  { ...base, id: 'p1', reference: 'EC-PAY-0000000001', status: 'succeeded', methodLabel: 'Visa ending 4242', invoiceNumber: 'EC-INV-2026-000001', paidAt: '2026-11-10T10:05:00Z' },
  { ...base, id: 'p2', reference: 'EC-PAY-0000000002', status: 'pending_verification', methodLabel: 'Bank transfer, transaction TXN-784512', bankReference: 'TXN-784512' },
  { ...base, id: 'p3', reference: 'EC-PAY-0000000003', status: 'failed', failureMessage: 'The card was declined by the bank.' },
  { ...base, id: 'p4', reference: 'EC-PAY-0000000004', status: 'requires_payment' },
]

beforeEach(() => vi.resetAllMocks())

describe('PaymentsPage', () => {
  it('lists every payment with its status, and links the invoice only where one exists', async () => {
    api.get.mockResolvedValue({ data: { payments } })
    render(<MemoryRouter><PaymentsPage /></MemoryRouter>)
    expect(await screen.findByText('EC-PAY-0000000001', { exact: false })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/payments')
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Awaiting confirmation')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('The card was declined by the bank.')).toBeInTheDocument()
    expect(screen.getByText(/transaction TXN-784512\) is waiting to be confirmed/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View invoice EC-INV-2026-000001' })).toHaveAttribute('href', '/account/payments/p1/invoice')
    expect(screen.getAllByRole('link', { name: /View invoice/ })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Continue this payment' })).toHaveAttribute('href', '/auction/payment')
  })

  it('has a useful empty state', async () => {
    api.get.mockResolvedValue({ data: { payments: [] } })
    render(<MemoryRouter><PaymentsPage /></MemoryRouter>)
    expect(await screen.findByText('No payments yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get membership' })).toHaveAttribute('href', '/auction/payment')
  })

  it('says when the payments cannot be loaded and retries', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Your payments could not be loaded.' } } })
    render(<MemoryRouter><PaymentsPage /></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Your payments could not be loaded.')
    api.get.mockResolvedValueOnce({ data: { payments: [] } })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No payments yet')).toBeInTheDocument()
  })
})

describe('InvoicePage', () => {
  const invoice = {
    invoiceNumber: 'EC-INV-2026-000001', issuedAt: '2026-11-10T10:05:00Z', status: 'PAID', sandbox: true,
    seller: { name: 'Executive Cars', address: 'Stadium Road, Rawalpindi, Pakistan', email: 'info@executivecars.pk' },
    buyer: { name: 'Test Customer', email: 'customer@example.com', phone: '+92 300 1234567' },
    lineItems: [{ description: 'Annual Auction Membership (1 year)', quantity: 1, unitPrice: 4999, amount: 4999 }],
    subtotal: 4999, total: 4999, amountPaid: 4999, currency: 'PKR',
    payment: { reference: 'EC-PAY-0000000001', method: 'card', methodLabel: 'Visa ending 4242', paidAt: '2026-11-10T10:05:00Z' },
    coverage: { from: '2026-11-10T10:05:00Z', to: '2027-11-10T10:05:00Z' },
  }
  const renderInvoice = () => render(<MemoryRouter initialEntries={['/account/payments/p1/invoice']}><Routes><Route path="/account/payments/:id/invoice" element={<InvoicePage />} /></Routes></MemoryRouter>)

  it('shows the seller, buyer, line item, totals, payment details and the sandbox notice', async () => {
    api.get.mockResolvedValue({ data: { invoice } })
    renderInvoice()
    const article = await screen.findByRole('article', { name: 'Invoice EC-INV-2026-000001' })
    expect(api.get).toHaveBeenCalledWith('/payments/p1/invoice')
    expect(article).toHaveTextContent('Executive Cars')
    expect(article).toHaveTextContent('Test Customer')
    expect(article).toHaveTextContent('customer@example.com')
    expect(article).toHaveTextContent('Annual Auction Membership (1 year)')
    expect(article).toHaveTextContent('PKR 4,999')
    expect(article).toHaveTextContent('Visa ending 4242')
    expect(article).toHaveTextContent('EC-PAY-0000000001')
    expect(article).toHaveTextContent('PAID')
    expect(article).toHaveTextContent('Balance due')
    expect(article).toHaveTextContent('no real money was charged')
    expect(screen.getByRole('table', { name: 'Items on this invoice' })).toBeInTheDocument()
  })

  it('prints through the browser', async () => {
    api.get.mockResolvedValue({ data: { invoice } })
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderInvoice()
    fireEvent.click(await screen.findByRole('button', { name: /Print or save as PDF/ }))
    expect(print).toHaveBeenCalledTimes(1)
    print.mockRestore()
  })

  it('does not claim a sandbox notice for a non-sandbox invoice', async () => {
    api.get.mockResolvedValue({ data: { invoice: { ...invoice, sandbox: false } } })
    renderInvoice()
    const article = await screen.findByRole('article')
    expect(article).not.toHaveTextContent('no real money was charged')
  })

  it('says why an invoice is unavailable and can retry', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 409, data: { message: 'An invoice is issued once the payment has succeeded.' } } })
    renderInvoice()
    expect(await screen.findByRole('alert')).toHaveTextContent('An invoice is issued once the payment has succeeded.')
    api.get.mockResolvedValueOnce({ data: { invoice } })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('article')).toBeInTheDocument()
  })
})
