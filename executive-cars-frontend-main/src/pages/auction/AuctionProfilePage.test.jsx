import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionProfilePage from './AuctionProfilePage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))
const auth = { user: { id: 'member-1', name: 'Ali Khan', role: 'user' }, logout: vi.fn(), updateUser: vi.fn() }
vi.mock('../../context/authContext.js', () => ({ useAuth: () => auth }))

const profile = { _id: 'member-1', name: 'Ali Khan', email: 'ali@example.com', phone: '+923001234567', cnic: '35202-1234567-1', city: 'Lahore', createdAt: '2026-01-01T00:00:00Z', subscriptionExpiry: '2027-01-01T00:00:00Z' }

async function renderProfile() {
  render(<MemoryRouter><AuctionProfilePage /></MemoryRouter>)
  await screen.findByText('Lahore')
}

describe('AuctionProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: profile })
  })

  it('discards unsaved edits when editing is cancelled', async () => {
    await renderProfile()
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Karachi' } })
    expect(screen.getByLabelText('City')).toHaveValue('Karachi')

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Lahore')).toBeInTheDocument()
    expect(screen.queryByText('Karachi')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    expect(screen.getByLabelText('City')).toHaveValue('Lahore')
  })

  it('keeps saved edits and uses them as the next cancel baseline', async () => {
    api.put.mockResolvedValue({ data: {} })
    await renderProfile()
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Karachi' } })
    fireEvent.click(screen.getByRole('button', { name: /^save/i }))
    await screen.findByText('Karachi')
    expect(api.put).toHaveBeenCalledWith('/member/profile', expect.objectContaining({ city: 'Karachi' }))

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Multan' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Karachi')).toBeInTheDocument()
  })

  it('labels the password fields and rejects a short new password before calling the API', async () => {
    await renderProfile()
    fireEvent.click(screen.getByRole('button', { name: /change password/i }))
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'old-password-1' } })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 8 characters')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows the server message and stays signed in when the current password is wrong', async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { message: 'Current password is incorrect' } } })
    await renderProfile()
    fireEvent.click(screen.getByRole('button', { name: /change password/i }))
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'wrong-password' } })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'brand-new-pass-1' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'brand-new-pass-1' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /update password/i })).toBeEnabled())
    expect(auth.logout).not.toHaveBeenCalled()
  })
})
