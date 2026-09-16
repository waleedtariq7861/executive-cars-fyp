import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import SellerDashboardPage from './SellerDashboardPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../../components/SellerLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ user: { name: 'Demo Seller' } }) }))

const deferred = () => {
  let resolve
  const promise = new Promise(resolvePromise => { resolve = resolvePromise })
  return { promise, resolve }
}

describe('SellerDashboardPage async states', () => {
  it('shows one loading state instead of false zero and empty claims', async () => {
    const bookings = deferred()
    const listings = deferred()
    api.get.mockImplementation(url => url.endsWith('/bookings') ? bookings.promise : listings.promise)
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SellerDashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Loading seller dashboard')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('My Bookings')).not.toBeInTheDocument()
    expect(screen.queryByText('No bookings yet')).not.toBeInTheDocument()
    expect(screen.queryByText('No listings yet')).not.toBeInTheDocument()

    bookings.resolve({ data: [{ _id: 'booking-1', carMake: 'Honda', carModel: 'Civic', carYear: 2020, branch: 'Islamabad', date: '2026-09-05', status: 'pending' }] })
    listings.resolve({ data: { auctionCars: [], usedCars: [{ _id: 'car-1', make: 'Honda', model: 'Civic', year: 2020, price: 4850000, status: 'available' }] } })

    expect(await screen.findByText('My Bookings')).toBeInTheDocument()
    expect(screen.getAllByText('Honda Civic 2020')).toHaveLength(2)
    expect(screen.queryByLabelText('Loading seller dashboard')).not.toBeInTheDocument()
  })
})
