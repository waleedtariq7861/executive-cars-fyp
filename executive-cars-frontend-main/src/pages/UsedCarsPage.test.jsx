import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import UsedCarsPage from './UsedCarsPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../components/Navbar.jsx', () => ({ default: () => <nav aria-label="Main navigation" /> }))
vi.mock('../components/Footer.jsx', () => ({ default: () => <footer /> }))
vi.mock('../context/toastContext.js', () => ({ useToast: () => ({ showToast: vi.fn() }) }))
vi.mock('../hooks/useSavedCars.js', () => ({ useSavedCars: () => ({ savedIds: [], toggleSaved: vi.fn() }) }))

describe('UsedCarsPage mobile filters', () => {
  it('opens a focus-managed dialog and restores focus to Filters on Escape', async () => {
    api.get.mockResolvedValue({ data: [] })
    render(<MemoryRouter><UsedCarsPage /></MemoryRouter>)
    const trigger = screen.getByRole('button', { name: 'Filters' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Search filters' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Search filters' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
