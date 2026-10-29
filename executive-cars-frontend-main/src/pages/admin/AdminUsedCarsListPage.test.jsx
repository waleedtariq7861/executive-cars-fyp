import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AdminUsedCarsListPage from './AdminUsedCarsListPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../../components/AdminLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../components/AdminOwnerSelect.jsx', () => ({
  default: ({ id = 'owner', value = '', onChange }) => <><label htmlFor={id}>Listing Owner</label><select id={id} value={typeof value === 'object' ? value?._id || '' : value} onChange={event => onChange(event.target.value)}><option value="">Executive Cars</option></select></>,
  ownerValue: value => typeof value === 'object' ? value?._id || '' : value || '',
  useAdminOwners: () => ({ owners: [], loadingOwners: false }),
}))

describe('AdminUsedCarsListPage accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    api.get.mockResolvedValue({ data: [{
      _id: 'car-1', make: 'Honda', model: 'City', year: 2022, km: 30000, price: 5000000,
      createdAt: '2026-09-01T00:00:00Z', ownerId: null,
    }] })
  })

  it('names row actions and exposes the editor as a labelled keyboard-dismissible dialog', async () => {
    render(<MemoryRouter><AdminUsedCarsListPage /></MemoryRouter>)
    const edit = await screen.findByRole('button', { name: 'Edit Honda City' })
    expect(screen.getByRole('button', { name: 'Delete Honda City' })).toBeInTheDocument()
    edit.focus()
    fireEvent.click(edit)

    expect(screen.getByRole('dialog', { name: 'Edit used car' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Listing Owner')).toBeInTheDocument()
    expect(screen.getByLabelText('Make')).toHaveValue('Honda')
    expect(screen.getByLabelText('Model')).toHaveValue('City')
    expect(screen.getByLabelText('Year')).toHaveValue('2022')
    expect(screen.getByLabelText('Mileage (km)')).toHaveValue('30000')
    expect(screen.getByLabelText('Price (PKR)')).toHaveValue('5000000')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(edit).toHaveFocus())
  })

  it('edits the city and can be cancelled from the form itself', async () => {
    api.put.mockResolvedValue({ data: { _id: 'car-1', make: 'Honda', model: 'City', year: 2022, km: 30000, price: 5000000, city: 'Lahore', createdAt: '2026-09-01T00:00:00Z' } })
    render(<MemoryRouter><AdminUsedCarsListPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Honda City' }))
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Lahore' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/products/car-1', expect.objectContaining({ city: 'Lahore' })))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Edit Honda City' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes the delete dialog and announces the error when deletion fails', async () => {
    api.delete.mockRejectedValue({ response: { data: { message: 'Car is referenced elsewhere' } } })
    render(<MemoryRouter><AdminUsedCarsListPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Honda City' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete used car?' })).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Car is referenced elsewhere')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Car is referenced elsewhere')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Delete Honda City' })).toBeInTheDocument()
  })

  it('removes the row and closes the dialog after a successful delete', async () => {
    api.delete.mockResolvedValue({ data: {} })
    render(<MemoryRouter><AdminUsedCarsListPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Honda City' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete used car?' })).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete Honda City' })).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
