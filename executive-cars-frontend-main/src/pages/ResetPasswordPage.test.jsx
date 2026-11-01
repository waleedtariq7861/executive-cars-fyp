import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import ResetPasswordPage from './ResetPasswordPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const token = 'a'.repeat(64)
const renderPage = (search = `?token=${token}`) => render(<MemoryRouter initialEntries={[`/reset-password${search}`]}><ResetPasswordPage /></MemoryRouter>)
const fill = (password, confirm = password) => {
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: confirm } })
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

beforeEach(() => api.post.mockReset())

describe('ResetPasswordPage', () => {
  it('sends the token and the new password, then confirms', async () => {
    api.post.mockResolvedValue({ data: {} })
    renderPage()
    fill('amber-meadow-58'); submit()
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token, password: 'amber-meadow-58' })
  })

  it('checks length and confirmation on the page before contacting the server', () => {
    renderPage()
    fill('short'); submit()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    fill('amber-meadow-58', 'amber-meadow-59'); submit()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows a server policy rejection next to the field and lets the person try another password', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'common', code: 'PASSWORD_COMMON', errors: { password: 'This password is too common. Choose something harder to guess.' } } } })
    api.post.mockResolvedValueOnce({ data: {} })
    renderPage()
    fill('letmein123'); submit()
    expect(await screen.findByText('This password is too common. Choose something harder to guess.')).toBeInTheDocument()
    expect(screen.getByLabelText('New password', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    fill('amber-meadow-58'); submit()
    await waitFor(() => expect(screen.getByText('Password updated')).toBeInTheDocument())
    expect(api.post).toHaveBeenCalledTimes(2)
  })

  it('shows an invalid or expired link as a page-level error, not as a password problem', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Invalid or expired reset link' } } })
    renderPage()
    fill('amber-meadow-58'); submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired reset link')
    expect(screen.getByLabelText('New password', { exact: true })).not.toHaveAttribute('aria-invalid')
  })

  it('removes the token from the address bar, keeps it for the request, and asks browsers not to send a Referer', async () => {
    window.history.pushState({}, '', `/reset-password?token=${token}`)
    api.post.mockResolvedValueOnce({ data: {} })
    const { unmount } = renderPage()
    expect(window.location.search).toBe('')
    expect(window.location.href).not.toContain(token)
    expect(document.head.querySelector('meta[name="referrer"]')?.content).toBe('no-referrer')
    fill('amber-meadow-58'); submit()
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token, password: 'amber-meadow-58' })
    unmount()
    expect(document.head.querySelector('meta[name="referrer"]')).toBeNull()
  })

  it('refuses to submit without a token', () => {
    renderPage('')
    fill('amber-meadow-58'); submit()
    expect(screen.getByRole('alert')).toHaveTextContent('This reset link is incomplete.')
    expect(api.post).not.toHaveBeenCalled()
  })
})
