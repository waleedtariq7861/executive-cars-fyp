import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionDashboardPage from './AuctionDashboardPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../../components/AuctionLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../components/CountdownTimer.jsx', () => ({ default: () => <span>Countdown</span> }))
vi.mock('../../components/VehicleImage.jsx', () => ({ default: ({ alt }) => <span>{alt} image</span> }))

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('AuctionDashboardPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a skeleton instead of false zero values while dashboard data is pending', async () => {
    const requests = {
      '/cars': deferred(),
      '/member/stats': deferred(),
      '/member/profile': deferred(),
    }
    api.get.mockImplementation(url => requests[url].promise)

    render(<MemoryRouter><AuctionDashboardPage /></MemoryRouter>)
    expect(screen.getByLabelText('Loading auction dashboard')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Active Auctions')).not.toBeInTheDocument()
    expect(screen.queryByText('No active auctions right now.')).not.toBeInTheDocument()

    requests['/cars'].resolve({ data: [{ _id: 'car-1', make: 'Honda', model: 'Civic', year: 2020, currentBid: 5150000, bidCount: 1, auctionEnd: new Date(Date.now() + 3600000).toISOString() }] })
    requests['/member/stats'].resolve({ data: { totalBids: 4, wonCars: 2 } })
    requests['/member/profile'].resolve({ data: { subscriptionExpiry: new Date(Date.now() + 10 * 86400000).toISOString() } })

    expect(await screen.findByText('Active Auctions')).toBeInTheDocument()
    expect(screen.getByText('1 bid')).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading auction dashboard')).not.toBeInTheDocument()
  })

  it('renders an error state rather than plausible zero statistics when any request fails', async () => {
    api.get.mockRejectedValue({ response: { data: { message: 'Dashboard request failed.' } } })
    render(<MemoryRouter><AuctionDashboardPage /></MemoryRouter>)

    expect(await screen.findByText('Auction dashboard unavailable')).toBeInTheDocument()
    expect(screen.getByText('Dashboard request failed.')).toBeInTheDocument()
    expect(screen.queryByText('Active Auctions')).not.toBeInTheDocument()
  })
})
