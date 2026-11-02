import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionLiveAuctionsPage from './AuctionLiveAuctionsPage.jsx'
import AuctionWonCarsPage from './AuctionWonCarsPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../../components/AuctionLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../components/VehicleImage.jsx', () => ({ default: ({ alt }) => <span>{alt} image</span> }))
vi.mock('../../components/CountdownTimer.jsx', () => ({ default: () => <span>countdown</span> }))
vi.mock('../../config/site.js', () => ({ siteConfig: { email: 'showroom@example.test', phone: '', phoneLabel: '' } }))

const soon = () => new Date(Date.now() + 3_600_000).toISOString()
const earlier = () => new Date(Date.now() - 3_600_000).toISOString()
const auction = (overrides = {}) => ({
  _id: 'a1', make: 'Honda', model: 'Civic', year: 2021, images: [], basePrice: 4_000_000, currentBid: 4_000_000, bidCount: 1,
  status: 'active', auctionStart: earlier(), auctionEnd: soon(), ...overrides,
})

beforeEach(() => vi.resetAllMocks())

describe('AuctionLiveAuctionsPage reserve', () => {
  const render_ = cars => { api.get.mockResolvedValue({ data: cars }); render(<MemoryRouter><AuctionLiveAuctionsPage /></MemoryRouter>) }

  it('says whether the reserve has been reached, from what the server reports', async () => {
    render_([
      auction({ _id: 'a1', model: 'Civic', hasReserve: true, reserveMet: false }),
      auction({ _id: 'a2', model: 'City', hasReserve: true, reserveMet: true }),
      auction({ _id: 'a3', model: 'Accord', hasReserve: false, reserveMet: true }),
    ])
    expect(await screen.findByText(/Reserve not met/)).toBeInTheDocument()
    expect(screen.getByText(/· Reserve met/)).toBeInTheDocument()
    expect(screen.getAllByText(/Reserve (not )?met/)).toHaveLength(2)
  })

  it('does not work the reserve out from a price, so an amount in the data changes nothing', async () => {
    render_([auction({ reservePrice: 9_999_999, currentBid: 1 })])
    await screen.findAllByText(/Honda Civic/)
    expect(screen.queryByText(/Reserve/)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('9,999,999')
  })
})

describe('AuctionWonCarsPage contact', () => {
  it('sends the winner to the showroom, never to an address taken from the listing', async () => {
    api.get.mockResolvedValue({ data: [auction({ status: 'ended', sellerEmail: 'private-seller@example.test' })] })
    render(<MemoryRouter><AuctionWonCarsPage /></MemoryRouter>)
    const link = await screen.findByRole('link', { name: /Contact the showroom/ })
    expect(link).toHaveAttribute('href', 'mailto:showroom@example.test')
    expect(document.body.innerHTML).not.toContain('private-seller@example.test')
  })
})
