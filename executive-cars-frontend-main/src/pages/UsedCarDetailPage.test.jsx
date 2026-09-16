import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { useSavedCars } from '../hooks/useSavedCars.js'
import { useToast } from '../context/toastContext.js'
import UsedCarDetailPage from './UsedCarDetailPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../hooks/useSavedCars.js', () => ({ useSavedCars: vi.fn() }))
vi.mock('../context/toastContext.js', () => ({ useToast: vi.fn() }))
vi.mock('../components/Navbar.jsx', () => ({ default: () => <nav aria-label="Primary navigation" /> }))
vi.mock('../components/Footer.jsx', () => ({ default: () => <footer /> }))
vi.mock('../components/VehicleImage.jsx', () => ({ default: ({ alt }) => <div role="img" aria-label={alt} /> }))

const car = {
  _id: 'car-1', make: 'Toyota', model: 'Corolla', year: 2020, km: 45000,
  price: 5250000, images: [], verificationStatus: 'verified', inspectionStatus: 'not_available',
}

const renderPage = () => render(
  <MemoryRouter initialEntries={['/used-cars/car-1']}>
    <Routes><Route path="/used-cars/:id" element={<UsedCarDetailPage />} /></Routes>
  </MemoryRouter>,
)

describe('UsedCarDetailPage saved cars', () => {
  const showToast = vi.fn()
  const toggleSaved = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation(url => Promise.resolve({ data: url === '/products/car-1' ? car : [] }))
    useToast.mockReturnValue({ showToast })
    useSavedCars.mockReturnValue({
      savedIds: [], syncing: false, serverBacked: true, toggleSaved,
    })
  })

  it('uses the server-backed saved-car contract for a signed-in customer', async () => {
    toggleSaved.mockResolvedValue(true)
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Save car' }))

    await waitFor(() => expect(toggleSaved).toHaveBeenCalledWith('car-1'))
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      tone: 'success', title: 'Car saved', message: 'Added to your account shortlist.',
    }))
  })

  it('reports a synchronization failure instead of a false success', async () => {
    toggleSaved.mockRejectedValue(new Error('Saved car could not be updated.'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Save car' }))

    await waitFor(() => expect(showToast).toHaveBeenCalledWith({
      tone: 'error', title: 'Could not update saved cars', message: 'Saved car could not be updated.',
    }))
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ tone: 'success' }))
  })
})
