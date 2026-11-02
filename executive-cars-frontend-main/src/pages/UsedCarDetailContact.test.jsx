import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { useSavedCars } from '../hooks/useSavedCars.js'
import { useToast } from '../context/toastContext.js'
import UsedCarDetailPage from './UsedCarDetailPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../hooks/useSavedCars.js', () => ({ useSavedCars: vi.fn() }))
vi.mock('../context/toastContext.js', () => ({ useToast: vi.fn() }))
vi.mock('../components/Navbar.jsx', () => ({ default: () => <nav /> }))
vi.mock('../components/Footer.jsx', () => ({ default: () => <footer /> }))
vi.mock('../components/VehicleImage.jsx', () => ({ default: ({ alt }) => <div role="img" aria-label={alt} /> }))
vi.mock('../config/site.js', () => ({ siteConfig: { email: 'showroom@example.test', phone: '', phoneLabel: '' } }))

const id = '5f1c0a9b8e7d6c5b4a392817'
const car = { _id: id, make: 'Toyota', model: 'Corolla', year: 2020, km: 45000, price: 5250000, images: [], verificationStatus: 'verified', inspectionStatus: 'not_available' }

beforeEach(() => {
  vi.clearAllMocks()
  useToast.mockReturnValue({ showToast: vi.fn() })
  useSavedCars.mockReturnValue({ savedIds: [], syncing: false, serverBacked: false, toggleSaved: vi.fn() })
})

describe('UsedCarDetailPage contact', () => {
  it('writes to the showroom address, and ignores any seller address that arrives with the listing', async () => {
    api.get.mockImplementation(url => Promise.resolve({ data: url === `/products/${id}` ? { ...car, sellerEmail: 'private-seller@example.test', ownerId: 'owner-1' } : [] }))
    render(<MemoryRouter initialEntries={[`/used-cars/${id}`]}><Routes><Route path="/used-cars/:id" element={<UsedCarDetailPage />} /></Routes></MemoryRouter>)
    await screen.findByRole('heading', { name: /Toyota Corolla/ })
    const links = [...document.querySelectorAll('a[href^="mailto:"]')]
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')).toMatch(/^mailto:showroom@example\.test/)
    expect(screen.getByText('showroom@example.test')).toBeInTheDocument()
    expect(document.body.innerHTML).not.toContain('private-seller@example.test')
  })
})
