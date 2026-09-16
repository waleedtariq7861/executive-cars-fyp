import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AdminDashboardPage from './AdminDashboardPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../../components/AdminLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

const deferred = () => {
  let resolve
  const promise = new Promise(resolvePromise => { resolve = resolvePromise })
  return { promise, resolve }
}

describe('AdminDashboardPage async states', () => {
  it('does not claim empty bookings or auctions while statistics are loading', async () => {
    const request = deferred()
    api.get.mockReturnValue(request.promise)
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminDashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Loading recent bookings')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading live auctions')).toBeInTheDocument()
    expect(screen.queryByText('No bookings yet')).not.toBeInTheDocument()
    expect(screen.queryByText('No active auctions')).not.toBeInTheDocument()

    request.resolve({ data: {
      totalMembers: 7, totalBookings: 5, liveAuctions: 1, usedCarsListed: 8,
      verifiedCars: 4, pendingInspections: 1, importedDatasetRows: 0, totalBids: 6,
      recentBookings: [{ _id: 'booking-1', name: 'Demo Member', carMake: 'Honda', carModel: 'City', branch: 'Islamabad', date: '2026-09-05', status: 'pending' }],
      liveAuctionList: [{ _id: 'car-1', make: 'Honda', model: 'Civic', year: 2020, currentBid: 4850000, bidCount: 3 }],
    } })

    expect(await screen.findByText('Demo Member')).toBeInTheDocument()
    expect(screen.getByText('3 bids')).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading recent bookings')).not.toBeInTheDocument()
  })
})
