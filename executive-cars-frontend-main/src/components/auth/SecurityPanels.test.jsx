import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import ActivityList from './ActivityList.jsx'
import ChangePasswordForm from './ChangePasswordForm.jsx'
import SessionsPanel from './SessionsPanel.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

beforeEach(() => vi.resetAllMocks())

describe('ChangePasswordForm', () => {
  const fill = (current, next, confirm = next) => {
    fireEvent.change(screen.getByLabelText('Current password', { exact: true }), { target: { value: current } })
    fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: next } })
    fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: confirm } })
  }
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

  it('checks the three fields on the page before contacting the server', () => {
    render(<ChangePasswordForm />)
    fill('', 'amber-meadow-58'); submit()
    expect(screen.getByText('Enter your current password.')).toBeInTheDocument()
    fill('old-password-1', 'short'); submit()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    fill('old-password-1', 'amber-meadow-58', 'amber-meadow-59'); submit()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('sends the passwords, confirms, and clears the fields', async () => {
    api.post.mockResolvedValue({ data: {} })
    render(<ChangePasswordForm />)
    fill('old-password-1', 'amber-meadow-58'); submit()
    expect(await screen.findByRole('status')).toHaveTextContent('Password updated. Your other devices were signed out.')
    expect(api.post).toHaveBeenCalledWith('/auth/change-password', { current: 'old-password-1', newPassword: 'amber-meadow-58' })
    expect(screen.getByLabelText('Current password', { exact: true })).toHaveValue('')
    fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: 'x' } })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the server\'s answer next to the field it is about', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'wrong', errors: { current: 'Current password is incorrect' } } } })
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'common', code: 'PASSWORD_COMMON', errors: { password: 'This password is too common. Choose something harder to guess.' } } } })
    render(<ChangePasswordForm />)
    fill('wrong-password-1', 'amber-meadow-58'); submit()
    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument()
    expect(screen.getByLabelText('Current password', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    fill('old-password-1', 'letmein123'); submit()
    expect(await screen.findByText('This password is too common. Choose something harder to guess.')).toBeInTheDocument()
    expect(screen.queryByText('Current password is incorrect')).not.toBeInTheDocument()
  })

  it('shows any other failure as a page-level error', async () => {
    api.post.mockRejectedValue({ response: { status: 500, data: { message: 'Password update failed' } } })
    render(<ChangePasswordForm />)
    fill('old-password-1', 'amber-meadow-58'); submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Password update failed')
  })
})

describe('SessionsPanel', () => {
  const sessions = [
    { id: 's1', current: true, device: 'Chrome on Windows', ip: '203.0.113.5', signedInAt: '2026-11-10T08:00:00Z', lastSeenAt: '2026-11-10T09:00:00Z' },
    { id: 's2', current: false, device: 'Safari on iOS', ip: '198.51.100.7', signedInAt: '2026-11-09T08:00:00Z', lastSeenAt: '2026-11-09T09:00:00Z' },
    { id: 's3', current: false, device: 'Firefox on Linux', signedInAt: '2026-11-08T08:00:00Z', lastSeenAt: '2026-11-08T09:00:00Z' },
  ]

  it('lists the devices, marks this one, and offers sign-out only for the others', async () => {
    api.get.mockResolvedValue({ data: { sessions } })
    render(<SessionsPanel />)
    expect(await screen.findByText('Chrome on Windows')).toBeInTheDocument()
    expect(screen.getByText('This device')).toBeInTheDocument()
    expect(screen.getByText(/198\.51\.100\.7/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Sign out Safari on iOS|^Sign out Firefox on Linux/ })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /^Sign out Chrome on Windows/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out all other devices' })).toBeInTheDocument()
  })

  it('signs one device out and reloads the list', async () => {
    api.get.mockResolvedValueOnce({ data: { sessions } }).mockResolvedValueOnce({ data: { sessions: [sessions[0], sessions[2]] } })
    api.delete.mockResolvedValue({ data: { revoked: 1 } })
    render(<SessionsPanel />)
    await screen.findByText('Safari on iOS')
    fireEvent.click(screen.getByRole('button', { name: /^Sign out Safari on iOS/ }))
    expect(await screen.findByText('That device was signed out.')).toBeInTheDocument()
    expect(api.delete).toHaveBeenCalledWith('/auth/sessions/s2')
    await waitFor(() => expect(screen.queryByText('Safari on iOS')).not.toBeInTheDocument())
  })

  it('signs every other device out in one step and says how many', async () => {
    api.get.mockResolvedValueOnce({ data: { sessions } }).mockResolvedValueOnce({ data: { sessions: [sessions[0]] } })
    api.post.mockResolvedValue({ data: { revoked: 2 } })
    render(<SessionsPanel />)
    await screen.findByText('Safari on iOS')
    fireEvent.click(screen.getByRole('button', { name: 'Sign out all other devices' }))
    expect(await screen.findByText('Signed out 2 other devices.')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/sessions/revoke-others')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Sign out all other devices' })).not.toBeInTheDocument())
  })

  it('has no bulk button when this is the only device', async () => {
    api.get.mockResolvedValue({ data: { sessions: [sessions[0]] } })
    render(<SessionsPanel />)
    await screen.findByText('Chrome on Windows')
    expect(screen.queryByRole('button', { name: /Sign out/ })).not.toBeInTheDocument()
  })

  it('reports a failed sign-out and a failed load, and the load can be retried', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Could not load your sessions' } } })
    api.get.mockResolvedValue({ data: { sessions } })
    render(<SessionsPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your sessions')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText('Safari on iOS')
    api.delete.mockRejectedValue({ response: { status: 404, data: { message: 'Session not found' } } })
    fireEvent.click(screen.getByRole('button', { name: /^Sign out Safari on iOS/ }))
    expect(await screen.findByText('Session not found')).toBeInTheDocument()
  })
})

describe('ActivityList', () => {
  it('shows each event in plain words with when, device and address, and flags the ones to look at twice', async () => {
    api.get.mockResolvedValue({ data: { events: [
      { id: 'e1', type: 'login_failure', at: '2026-11-10T09:00:00Z', device: 'Chrome on Windows', ip: '203.0.113.5' },
      { id: 'e2', type: 'login_success', at: '2026-11-10T08:00:00Z', device: 'Safari on iOS' },
    ] } })
    render(<ActivityList />)
    const failure = await screen.findByText('Failed sign-in attempt')
    expect(failure).toHaveClass('text-amber-700')
    expect(screen.getByText('Signed in')).not.toHaveClass('text-amber-700')
    expect(screen.getByText('Chrome on Windows · 203.0.113.5')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/auth/activity')
  })

  it('has an empty state and an error state', async () => {
    api.get.mockResolvedValueOnce({ data: { events: [] } })
    const { unmount } = render(<ActivityList />)
    expect(await screen.findByText('Nothing has been recorded yet.')).toBeInTheDocument()
    unmount()
    api.get.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Could not load your recent activity' } } })
    render(<ActivityList />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your recent activity')
  })
})
