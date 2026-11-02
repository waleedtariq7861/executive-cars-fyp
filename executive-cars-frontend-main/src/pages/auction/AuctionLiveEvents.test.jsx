import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionCarDetailPage from './AuctionCarDetailPage.jsx'

const { handlers, socket } = vi.hoisted(() => {
  const registered = {}
  return { handlers: registered, socket: { emit: vi.fn(), on: (event, handler) => { registered[event] = handler }, off: vi.fn() } }
})
vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../api/socket.js', () => ({ connectSocket: () => socket }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'member-1', role: 'user' } }) }))

const live = {
  _id: 'car-1', make: 'Toyota', model: 'Yaris', year: 2022, km: 12000, engine: '1500', fuel: 'Petrol', transmission: 'Auto',
  color: 'White', basePrice: 3000000, currentBid: 3000000, bidCount: 0, minimumBidIncrement: 50000, status: 'active', images: [],
  auctionStart: new Date(Date.now() - 60_000).toISOString(), auctionEnd: new Date(Date.now() + 3_600_000).toISOString(),
}

const open = async () => {
  api.get.mockImplementation(url => Promise.resolve({ data: url.startsWith('/bids/') ? [] : live }))
  render(<MemoryRouter initialEntries={['/auction/car/car-1']}><Routes><Route path="/auction/car/:id" element={<AuctionCarDetailPage />} /></Routes></MemoryRouter>)
  await screen.findByLabelText(/your bid/i)
}
const receive = (event, payload) => act(async () => { handlers[event](payload) })

beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollTo = vi.fn()
  for (const key of Object.keys(handlers)) delete handlers[key]
})

describe('live bids as the server now sends them', () => {
  it('shows another bidder by the masked name the server gave, and never works out a name itself', async () => {
    await open()
    await receive('bid-update', { carId: 'car-1', currentBid: 3_100_000, bidCount: 1, highestBidder: { name: 'Ri***' } })
    expect(screen.getAllByText(/Ri\*\*\* just bid PKR/).length).toBeGreaterThan(0)
  })

  it('shows "You" only when the server says the bid is this browser\'s own', async () => {
    await open()
    await receive('bid-update', { carId: 'car-1', currentBid: 3_100_000, bidCount: 1, highestBidder: { isMe: true, name: 'You' } })
    expect(screen.getAllByText(/You just bid PKR/).length).toBeGreaterThan(0)
  })

  it('does not treat an account id in the payload as proof of who bid', async () => {
    await open()
    await receive('bid-update', { carId: 'car-1', currentBid: 3_100_000, bidCount: 1, highestBidder: { _id: 'member-1', name: 'Zz***' } })
    expect(screen.queryByText(/You just bid/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Zz\*\*\* just bid PKR/).length).toBeGreaterThan(0)
  })

  it('ignores updates for another auction', async () => {
    await open()
    await receive('bid-update', { carId: 'other', currentBid: 9_999_999, bidCount: 9, highestBidder: { name: 'Xx***' } })
    expect(screen.queryByText(/Xx\*\*\*/)).not.toBeInTheDocument()
  })

  it('says the winner won only when the server says so', async () => {
    await open()
    await receive('auction-ended', { carId: 'car-1', finalBid: 3_400_000, reserveMet: true, winner: { name: 'Ri***' } })
    expect(screen.getAllByText('This auction has ended.').length).toBeGreaterThan(0)
    expect(screen.queryByText(/you won this car/)).not.toBeInTheDocument()
  })

  it('congratulates the winner who is told they won', async () => {
    await open()
    await receive('auction-ended', { carId: 'car-1', finalBid: 3_400_000, reserveMet: true, winner: { isMe: true, name: 'You' } })
    expect(screen.getAllByText(/you won this car for PKR/).length).toBeGreaterThan(0)
  })

  it('does not take an account id for a win', async () => {
    await open()
    await receive('auction-ended', { carId: 'car-1', finalBid: 3_400_000, reserveMet: true, winner: { _id: 'member-1', name: 'Zz***' } })
    expect(screen.queryByText(/you won this car/)).not.toBeInTheDocument()
  })

  it('shows no winner when there is none', async () => {
    await open()
    await receive('auction-ended', { carId: 'car-1', finalBid: 3_000_000, reserveMet: false, winner: null })
    expect(screen.getAllByText('This auction has ended.').length).toBeGreaterThan(0)
  })
})
