import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AdminAuctionListPage from './AdminAuctionListPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../../components/AdminLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../components/AdminOwnerSelect.jsx', () => ({
  default: () => null,
  ownerValue: value => typeof value === 'object' ? value?._id || '' : value || '',
  useAdminOwners: () => ({ owners: [], loadingOwners: false }),
}))

describe('AdminAuctionListPage accessibility', () => {
  const auction = {
    _id: 'auction-1', make: 'Toyota', model: 'Corolla', year: 2022, basePrice: 5000000,
    currentBid: 5200000, auctionEnd: '2026-10-01T00:00:00Z', status: 'active', ownerId: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [auction] })
  })

  it('uses a labelled confirmation dialog before closing an auction', async () => {
    api.post.mockResolvedValue({ data: { auction: { ...auction, status: 'ended' } } })
    render(<MemoryRouter><AdminAuctionListPage /></MemoryRouter>)

    const closeButton = await screen.findByRole('button', { name: 'Close Toyota Corolla auction' })
    closeButton.focus()
    fireEvent.click(closeButton)

    expect(screen.getByRole('dialog', { name: 'Close auction?' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText(/stops further bids/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close auction' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/cars/auction-1/close'))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Close auction?' })).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Close Toyota Corolla auction' })).not.toBeInTheDocument()
  })

  it('cancels without calling the close endpoint and restores action focus', async () => {
    render(<MemoryRouter><AdminAuctionListPage /></MemoryRouter>)
    const closeButton = await screen.findByRole('button', { name: 'Close Toyota Corolla auction' })
    closeButton.focus()
    fireEvent.click(closeButton)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(api.post).not.toHaveBeenCalled()
    await waitFor(() => expect(closeButton).toHaveFocus())
  })
})
