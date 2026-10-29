import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import BecomeSellerPage from './BecomeSellerPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../context/authContext.js', () => ({
  useAuth: () => ({ user: { id: 'member-1', role: 'user', name: 'Test Seller', email: 'seller@example.com', phone: '+923001234567' }, logout: vi.fn() }),
}))

const tomorrow = new Date(Date.now() + 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

async function reachDocumentsStep() {
  render(<MemoryRouter><BecomeSellerPage /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('CNIC Number'), { target: { value: '3520212345671' } })
  fireEvent.click(screen.getByRole('button', { name: /next step/i }))

  fireEvent.change(await screen.findByLabelText('Car Make'), { target: { value: 'Toyota' } })
  fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Corolla' } })
  fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2020' } })
  fireEvent.change(screen.getByLabelText('Mileage (km)'), { target: { value: '40000' } })
  fireEvent.change(screen.getByLabelText('Engine CC'), { target: { value: '1800' } })
  fireEvent.click(screen.getByRole('button', { name: /next step/i }))
  await screen.findByLabelText('Preferred Inspection Date')
}

describe('BecomeSellerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.post.mockResolvedValue({ data: {} })
  })

  it('binds personal-detail labels to their inputs', () => {
    render(<MemoryRouter><BecomeSellerPage /></MemoryRouter>)
    for (const label of ['Full Name', 'Phone Number', 'CNIC Number', 'Email Address']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('keeps the document upload inputs reachable by keyboard and screen readers', async () => {
    await reachDocumentsStep()
    for (const name of ['CNIC image', 'Vehicle registration document']) {
      const input = screen.getByLabelText(name)
      expect(input).toHaveAttribute('type', 'file')
      expect(input).not.toHaveClass('hidden') // display:none removes it from the tab order
      expect(input).toHaveClass('sr-only')
    }
  })

  it('verifies the email in the shared accessible dialog, accepting a pasted code', async () => {
    await reachDocumentsStep()
    fireEvent.change(screen.getByLabelText('Preferred Inspection Date'), { target: { value: tomorrow } })
    fireEvent.change(screen.getByLabelText('Preferred Time'), { target: { value: '10:00 AM - 12:00 PM' } })
    fireEvent.change(screen.getByLabelText('Select Branch'), { target: { value: 'Rawalpindi - Stadium Road Branch' } })
    fireEvent.click(screen.getByRole('button', { name: /book inspection/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Verify your email' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText(/seller@example.com/)).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByLabelText('Digit 1')).toHaveFocus())

    fireEvent.paste(within(dialog).getByRole('group', { name: '6-digit verification code' }), { clipboardData: { getData: () => '123 456' } })
    for (const [index, digit] of [...'123456'].entries()) {
      expect(within(dialog).getByLabelText(`Digit ${index + 1}`)).toHaveValue(digit)
    }

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('reports an OTP delivery failure as a form error, not a date error', async () => {
    await reachDocumentsStep()
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Too many codes requested' } } })
    fireEvent.change(screen.getByLabelText('Preferred Inspection Date'), { target: { value: tomorrow } })
    fireEvent.change(screen.getByLabelText('Preferred Time'), { target: { value: '10:00 AM - 12:00 PM' } })
    fireEvent.change(screen.getByLabelText('Select Branch'), { target: { value: 'Rawalpindi - Stadium Road Branch' } })
    fireEvent.click(screen.getByRole('button', { name: /book inspection/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many codes requested')
    expect(screen.getByLabelText('Preferred Inspection Date')).not.toHaveAttribute('aria-invalid', 'true')
  })
})
