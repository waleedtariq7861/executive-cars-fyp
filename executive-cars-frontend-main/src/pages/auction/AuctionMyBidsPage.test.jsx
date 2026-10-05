import React from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionMyBidsPage from './AuctionMyBidsPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'member-1' } }) }))
vi.mock('../../components/AuctionLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../components/VehicleImage.jsx', () => ({ default: ({ alt }) => <span>{alt} image</span> }))

const bidFor = (status, id = status, overrides = {}) => ({
  _id: `bid-${id}`, amount: 3500000,
  auctionState: { status, biddingOpen: ['leading', 'outbid'].includes(status) },
  carId: { _id: id, make: 'Toyota', model: id, year: 2018,
    status: ['leading', 'outbid', 'upcoming', 'awaiting_result'].includes(status) ? 'active' : status === 'cancelled' ? 'cancelled' : 'ended',
    currentBid: 3500000, highestBidder: { _id: 'member-1' },
    auctionStart: new Date(Date.now() - 60000).toISOString(),
    auctionEnd: new Date(Date.now() + 3600000).toISOString() },
  ...overrides,
})

describe('AuctionMyBidsPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.useRealTimers())

  it('does not present zero statistics or an empty state while bids are loading', async () => {
    let resolveRequest
    api.get.mockReturnValue(new Promise(resolve => { resolveRequest = resolve }))
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)

    expect(screen.getByText('Loading bids...')).toBeInTheDocument()
    expect(screen.getByText('Total Bids').parentElement).toHaveTextContent('—')
    expect(screen.queryByText('No bids in this category.')).not.toBeInTheDocument()

    resolveRequest({ data: [] })
    expect(await screen.findByText('No bids in this category.')).toBeInTheDocument()
    expect(screen.getByText('Total Bids').parentElement).toHaveTextContent('0')
  })

  it('shows an unsold highest bid as Unsold, excludes it from Won and offers a result link', async () => {
    api.get.mockResolvedValue({ data: [{
      _id: 'bid-unsold', amount: 3500000,
      auctionState: { status: 'unsold', biddingOpen: false },
      carId: { _id: 'corolla', make: 'Toyota', model: 'Corolla', year: 2018,
        status: 'ended', currentBid: 3500000, reservePrice: 4000000,
        highestBidder: { _id: 'member-1' }, auctionEnd: '2026-09-01T00:00:00Z' },
    }] })
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)
    const card = (await screen.findByRole('heading', { name: 'Toyota Corolla 2018' })).closest('article')
    expect(within(card).getByText('Unsold')).toBeInTheDocument()
    expect(within(card).queryByText('You won!')).not.toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'View result' })).toHaveAttribute('href', '/auction/car/corolla')
    expect(screen.queryByRole('link', { name: 'Rebid' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Won' }))
    expect(screen.getByText('No bids in this category.')).toBeInTheDocument()
  })

  it('offers Rebid only on live Outbid cards; closed results remain navigable', async () => {
    api.get.mockResolvedValue({ data: ['leading', 'outbid', 'won', 'lost', 'cancelled', 'upcoming', 'awaiting_result'].map(status => bidFor(status)) })
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Toyota outbid 2018' })
    expect(screen.getAllByRole('link', { name: 'Rebid' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Rebid' })).toHaveAttribute('href', '/auction/car/outbid')
    for (const [id, label] of [['won', 'View result'], ['lost', 'View result'], ['cancelled', 'View details'], ['upcoming', 'View details'], ['awaiting_result', 'View details']]) {
      const card = screen.getByRole('heading', { name: `Toyota ${id} 2018` }).closest('article')
      expect(within(card).getByRole('link', { name: label })).toHaveAttribute('href', `/auction/car/${id}`)
      expect(within(card).queryByRole('link', { name: 'Rebid' })).not.toBeInTheDocument()
    }
    expect(screen.getByText('Won', { selector: 'div.text-gray-500' }).parentElement).toHaveTextContent('1')
    fireEvent.click(screen.getByRole('button', { name: 'Won' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('You won!')).toBeInTheDocument()
  })

  it('keeps event totals while showing only the latest bid card for each auction', async () => {
    api.get.mockResolvedValue({ data: [bidFor('unsold', 'duplicate'), bidFor('unsold', 'duplicate', { _id: 'earlier', amount: 3400000 })] })
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Toyota duplicate 2018' })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Total Bids').parentElement).toHaveTextContent('2')
    expect(screen.queryByText(/3,400,000/)).not.toBeInTheDocument()
  })

  it('does not infer Won from legacy responses or link a missing auction', async () => {
    const legacy = bidFor('won', 'legacy')
    delete legacy.auctionState
    api.get.mockResolvedValue({ data: [legacy, bidFor('unavailable', 'missing', { carId: null })] })
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Auction unavailable' })
    expect(screen.queryByText('You won!')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Rebid' })).not.toBeInTheDocument()
    const missing = screen.getByRole('heading', { name: 'Auction unavailable' }).closest('article')
    expect(within(missing).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Total Bids').parentElement).toHaveTextContent('2')
  })

  it('removes Rebid at the end boundary without inventing a final win', async () => {
    vi.useFakeTimers()
    const bid = bidFor('outbid', 'expiring')
    bid.carId.auctionEnd = new Date(Date.now() + 1000).toISOString()
    api.get.mockResolvedValue({ data: [bid] })
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)
    await act(async () => {})
    expect(screen.getByRole('link', { name: 'Rebid' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    const card = screen.getByRole('article')
    expect(within(card).getByText('Awaiting result')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Rebid' })).not.toBeInTheDocument()
    expect(screen.queryByText('You won!')).not.toBeInTheDocument()
  })
})
