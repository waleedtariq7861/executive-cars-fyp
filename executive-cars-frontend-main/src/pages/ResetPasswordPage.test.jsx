import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import ResetPasswordPage from './ResetPasswordPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const arrived = { email: 'person@example.com', message: 'If that email belongs to an account, a password reset code will be sent to it.' }
const renderPage = (state = arrived) => render(<MemoryRouter initialEntries={[{ pathname: '/reset-password', state }]}><ResetPasswordPage /></MemoryRouter>)
const typeCode = value => fireEvent.change(screen.getByLabelText(/6-digit code/), { target: { value } })
const fill = (password, confirm = password) => {
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirm new password', { exact: true }), { target: { value: confirm } })
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

beforeEach(() => { api.post.mockReset(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

describe('ResetPasswordPage', () => {
  it('shows the neutral confirmation from the previous step and the address it carried', () => {
    renderPage()
    expect(screen.getByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText(/If that email belongs to an account/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.com')
  })

  it('sends the address, the code without spaces and the new password, then confirms', async () => {
    api.post.mockResolvedValue({ data: {} })
    renderPage()
    typeCode('123 456'); fill('amber-meadow-58'); submit()
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { email: 'person@example.com', code: '123456', password: 'amber-meadow-58' })
  })

  it('only lets digits be typed into the code field', () => {
    renderPage()
    typeCode('12ab34')
    expect(screen.getByLabelText(/6-digit code/)).toHaveValue('1234')
  })

  it('checks the address, code, length and confirmation on the page before contacting the server', () => {
    renderPage({})
    fill('amber-meadow-58'); typeCode('123456'); submit()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.com' } })
    typeCode('12345'); submit()
    expect(screen.getByText('Enter the 6-digit code from the email.')).toBeInTheDocument()
    typeCode('123456'); fill('short'); submit()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    fill('amber-meadow-58', 'amber-meadow-59'); submit()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows a server policy rejection next to the field and lets the person try another password', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'common', code: 'PASSWORD_COMMON', errors: { password: 'This password is too common. Choose something harder to guess.' } } } })
    api.post.mockResolvedValueOnce({ data: {} })
    renderPage()
    typeCode('123456'); fill('letmein123'); submit()
    expect(await screen.findByText('This password is too common. Choose something harder to guess.')).toBeInTheDocument()
    expect(screen.getByLabelText('New password', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/6-digit code/)).toHaveValue('123456')
    fill('amber-meadow-58'); submit()
    await waitFor(() => expect(screen.getByText('Password updated')).toBeInTheDocument())
    expect(api.post).toHaveBeenCalledTimes(2)
  })

  it('shows a wrong or expired code next to the code field, not as a password problem', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'That code is incorrect or has expired. Request a new one.', code: 'RESET_CODE_INVALID' } } })
    renderPage()
    typeCode('123456'); fill('amber-meadow-58'); submit()
    expect(await screen.findByText('That code is incorrect or has expired. Request a new one.')).toBeInTheDocument()
    expect(screen.getByLabelText(/6-digit code/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('New password', { exact: true })).not.toHaveAttribute('aria-invalid')
  })

  it('shows any other failure as a page-level error', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Could not reset password' } } })
    renderPage()
    typeCode('123456'); fill('amber-meadow-58'); submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reset password')
  })

  it('shows the local development code only when the server returned one', () => {
    renderPage({ ...arrived, developmentCode: '654321' })
    expect(screen.getByText('654321')).toBeInTheDocument()
    expect(screen.getByText('Local delivery')).toBeInTheDocument()
  })

  it('offers a new code after a minute, asks the server for it and starts the wait again', async () => {
    api.post.mockResolvedValue({ data: { message: 'If that email belongs to an account, a password reset code will be sent to it.', developmentCode: '111111' } })
    renderPage()
    typeCode('999999')
    const button = screen.getByRole('button', { name: /Send a new code in 1 minute|Send a new code in 60 seconds/ })
    expect(button).toBeDisabled()
    for (let second = 0; second < 60; second += 1) await act(async () => { vi.advanceTimersByTime(1000) })
    const ready = screen.getByRole('button', { name: 'Send a new code' })
    expect(ready).toBeEnabled()
    await act(async () => { fireEvent.click(ready) })
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'person@example.com' })
    expect(screen.getByText('111111')).toBeInTheDocument()
    expect(screen.getByLabelText(/6-digit code/)).toHaveValue('')
    expect(screen.getByRole('button', { name: /Send a new code in/ })).toBeDisabled()
  })

  it('does not ask for a new code without a valid address, and shows a rate limit from the server', async () => {
    renderPage({})
    await act(async () => { vi.advanceTimersByTime(0) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Send a new code' })) })
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()

    api.post.mockRejectedValueOnce({ response: { status: 429, data: { message: 'Too many password reset requests. Please try again in 15 minutes.', retryAfterSeconds: 90 } } })
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.com' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Send a new code' })) })
    expect(screen.getByRole('alert')).toHaveTextContent('Too many password reset requests')
    expect(screen.getByRole('button', { name: /Send a new code in/ })).toBeDisabled()
  })

  it('keeps no secret in the address bar and sets no referrer override any more', () => {
    renderPage()
    expect(window.location.search).toBe('')
    expect(document.head.querySelector('meta[name="referrer"]')).toBeNull()
  })
})
