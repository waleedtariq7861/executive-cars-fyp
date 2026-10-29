import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionCarDetailPage from './AuctionCarDetailPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../api/socket.js', () => ({ connectSocket: () => ({ emit: vi.fn(), on: vi.fn(), off: vi.fn() }) }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'member-1', role: 'user' } }) }))

const NOW = new Date('2026-10-29T10:00:00Z').getTime()
const car = overrides => ({
  _id: 'car-1', make: 'Toyota', model: 'Yaris', year: 2022, km: 12000, engine: '1500', fuel: 'Petrol', transmission: 'Auto',
  color: 'White', basePrice: 3000000, currentBid: 3000000, bidCount: 0, minimumBidIncrement: 50000, status: 'active',
  images: [], ...overrides,
})

async function renderDetail(data) {
  api.get.mockImplementation(url => Promise.resolve({ data: url.startsWith('/bids/') ? [] : data }))
  render(<MemoryRouter initialEntries={['/auction/car/car-1']}><Routes><Route path="/auction/car/:id" element={<AuctionCarDetailPage />} /></Routes></MemoryRouter>)
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
}

describe('AuctionCarDetailPage follows the auction clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    Element.prototype.scrollTo = vi.fn() // jsdom does not implement element scrolling
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

  it('opens bidding on screen when an upcoming auction reaches its start time', async () => {
    await renderDetail(car({ auctionStart: new Date(NOW + 3000).toISOString(), auctionEnd: new Date(NOW + 3600000).toISOString() }))
    expect(screen.getByText('Auction has not started')).toBeInTheDocument()
    expect(screen.queryByLabelText(/your bid/i)).not.toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(3100) })
    expect(screen.queryByText('Auction has not started')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/your bid/i)).toBeInTheDocument()
    expect(screen.getByText('LIVE AUCTION')).toBeInTheDocument()
  })

  it('closes bidding on screen when a running auction reaches its end time', async () => {
    await renderDetail(car({ auctionStart: new Date(NOW - 60000).toISOString(), auctionEnd: new Date(NOW + 2000).toISOString() }))
    expect(screen.getByLabelText(/your bid/i)).toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(2100) })
    expect(screen.getByText('Bidding is closed')).toBeInTheDocument()
    expect(screen.getByText('AUCTION ENDED')).toBeInTheDocument()
    expect(screen.queryByLabelText(/your bid/i)).not.toBeInTheDocument()
  })
})
