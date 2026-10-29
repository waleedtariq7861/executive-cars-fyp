import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage.jsx'
import { AuthContext } from '../context/authContext.js'

vi.mock('../api/api.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

describe('HomePage inventory sections', () => {
  const car = (id, make, createdAt, extra = {}) => ({ _id: id, make, model: 'M', year: 2020, price: 1000000, km: 1, images: [], createdAt, ...extra })

  it('does not repeat a featured car under "Recently Added"', async () => {
    const api = (await import('../api/api.js')).default
    api.get.mockResolvedValueOnce({ data: [
      car('verified-1', 'Honda', '2026-01-01', { verificationStatus: 'verified' }),
      car('new-1', 'Toyota', '2026-03-01'),
      car('new-2', 'Suzuki', '2026-02-01'),
    ] })
    render(<AuthContext.Provider value={{ user: null, logout: () => {} }}><MemoryRouter><HomePage /></MemoryRouter></AuthContext.Provider>)

    const recent = (await screen.findByRole('heading', { name: 'Recently Added Cars' })).closest('section')
    expect(recent).toHaveTextContent('Toyota M 2020')
    expect(recent).toHaveTextContent('Suzuki M 2020')
    expect(recent).not.toHaveTextContent('Honda M 2020')
    // newest first
    expect(recent.textContent.indexOf('Toyota')).toBeLessThan(recent.textContent.indexOf('Suzuki'))
  })

  it('hides "Recently Added" when every car is already featured', async () => {
    const api = (await import('../api/api.js')).default
    api.get.mockResolvedValueOnce({ data: [car('only', 'Honda', '2026-01-01', { verificationStatus: 'verified' })] })
    render(<AuthContext.Provider value={{ user: null, logout: () => {} }}><MemoryRouter><HomePage /></MemoryRouter></AuthContext.Provider>)
    await screen.findByText('Honda M 2020')
    expect(screen.queryByRole('heading', { name: 'Recently Added Cars' })).not.toBeInTheDocument()
  })
})

describe('HomePage branding', () => {
  it('uses the official heading, slogan, and supporting description', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: () => {} }}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(
      screen.getByRole('heading', { level: 1, name: "Pakistan's Smart Automotive Marketplace" })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('From Inspection to Auction, Everything Smart.')
    ).toHaveLength(2)
    expect(
      screen.getByText('Buy, sell, inspect, value, and auction vehicles through one trusted platform designed for transparency, convenience, and smarter decisions.')
    ).toBeInTheDocument()
  })
})
