import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

function NextStep() {
  const location = useLocation()
  return <p data-testid="next">{location.pathname} {JSON.stringify(location.state)}</p>
}
const renderPage = () => render(
  <MemoryRouter initialEntries={['/forgot-password']}>
    <Routes>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<NextStep />} />
    </Routes>
  </MemoryRouter>,
)
const submit = async (address = 'person@example.com') => {
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: address } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Send reset code|Try again in/ })) })
}

beforeEach(() => { api.post.mockReset(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

describe('ForgotPasswordPage', () => {
  it('asks for the email, then moves to the code step carrying the address in router state, not in the URL', async () => {
    api.post.mockResolvedValue({ data: { message: 'If that email belongs to an account, a password reset code will be sent to it.' } })
    renderPage()
    await submit(' person@example.com ')
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'person@example.com' })
    const next = screen.getByTestId('next')
    expect(next).toHaveTextContent('/reset-password')
    expect(next).toHaveTextContent('"email":"person@example.com"')
    expect(next).toHaveTextContent('If that email belongs to an account')
    expect(next.textContent).not.toContain('?')
  })

  it('passes on the local development code only when the server returned one', async () => {
    api.post.mockResolvedValue({ data: { message: 'sent', developmentCode: '123456' } })
    renderPage()
    await submit()
    expect(screen.getByTestId('next')).toHaveTextContent('"developmentCode":"123456"')
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

  it('shows a server problem next to the field, keeps the address and stays on the page', async () => {
    api.post.mockRejectedValue({ response: { status: 500, data: { message: 'Could not process password reset request' } } })
    renderPage()
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Could not process password reset request')
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.com')
    expect(screen.queryByTestId('next')).not.toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: /Send reset code/ })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
