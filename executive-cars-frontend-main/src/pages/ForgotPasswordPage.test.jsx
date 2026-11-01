import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const renderPage = () => render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
const submit = async (address = 'person@example.com') => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: address } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Send reset instructions|Try again in/ })) })
}

beforeEach(() => { api.post.mockReset(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

describe('ForgotPasswordPage', () => {
  it('asks for the email and shows the same neutral confirmation whatever the answer', async () => {
    api.post.mockResolvedValue({ data: { message: 'If that email belongs to an account, password reset instructions will be sent.' } })
    renderPage()
    await submit()
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'person@example.com' })
    expect(screen.getByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText(/If that email belongs to an account/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to sign in/ })).toHaveAttribute('href', '/login')
  })

  it('checks the address before contacting the server and links the error to the field', async () => {
    renderPage()
    await submit('not-an-email')
    expect(api.post).not.toHaveBeenCalled()
    const field = screen.getByLabelText(/Email address/)
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field.getAttribute('aria-describedby')).toContain('recovery-email-error')
  })

  it('shows a server problem next to the field and keeps the address', async () => {
    api.post.mockRejectedValue({ response: { status: 500, data: { message: 'Could not process password reset request' } } })
    renderPage()
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Could not process password reset request')
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.com')
  })

  it('when too many requests were made, disables the button with a countdown and then allows another try', async () => {
    api.post.mockRejectedValue({ response: { status: 429, data: { message: 'Too many password reset requests. Please try again in 15 minutes.', code: 'RATE_LIMITED' }, headers: { 'retry-after': '2' } } })
    renderPage()
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Too many password reset requests')
    const waiting = screen.getByRole('button', { name: 'Try again in 2 seconds' })
    expect(waiting).toBeDisabled()
    fireEvent.submit(waiting.closest('form'))
    expect(api.post).toHaveBeenCalledTimes(1)
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: /Send reset instructions/ })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offers the local reset link only when the server returns one (development delivery)', async () => {
    api.post.mockResolvedValue({ data: { message: 'sent', developmentResetUrl: 'http://127.0.0.1:5173/reset-password?token=abc' } })
    renderPage()
    await submit()
    expect(screen.getByRole('link', { name: 'Open the reset link.' })).toHaveAttribute('href', '/reset-password?token=abc')
  })
})
