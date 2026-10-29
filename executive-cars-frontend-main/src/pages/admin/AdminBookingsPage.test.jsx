import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AdminBookingsPage from './AdminBookingsPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))
vi.mock('../../components/AdminLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

const booking = { _id: 'b1', name: 'Sara Ahmed', phone: '+923001112233', carMake: 'Honda', carModel: 'Civic', carYear: 2019, date: '2026-11-02', branch: 'Rawalpindi - Stadium Road Branch', status: 'pending' }

describe('AdminBookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [booking] })
  })

  it('offers a filter for every status the page counts, including Approved and Rejected', async () => {
    render(<AdminBookingsPage />)
    await screen.findByText('Sara Ahmed')
    for (const name of ['All', 'Pending', 'Approved', 'Rejected', 'Confirmed', 'Completed', 'Cancelled']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Approved' }))
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/admin/bookings', { params: { status: 'approved' } }))
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('names the approve and reject icon buttons by booking', async () => {
    api.patch.mockResolvedValue({ data: {} })
    render(<AdminBookingsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve Sara Ahmed booking' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/bookings/b1', { status: 'approved' }))
    expect(screen.queryByRole('button', { name: 'Reject Sara Ahmed booking' })).not.toBeInTheDocument()
  })
})
