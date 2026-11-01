import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SignupForm from './SignupForm.jsx'

const register = vi.fn()
const onSuccess = vi.fn()

const renderForm = (props = {}) => render(<MemoryRouter><SignupForm register={register} onSuccess={onSuccess} {...props} /></MemoryRouter>)
const fill = (overrides = {}) => {
  const values = { 'Full Name': 'New Customer', 'Email Address': 'new@example.com', 'Phone Number': '+923001234567', Password: 'orchid-lantern-42', 'Confirm Password': 'orchid-lantern-42', ...overrides }
  for (const [label, value] of Object.entries(values)) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } })
}
const submit = (name = 'Create Account') => fireEvent.click(screen.getByRole('button', { name }))
const accept = () => fireEvent.click(screen.getByRole('checkbox'))

beforeEach(() => { register.mockReset(); onSuccess.mockReset() })

describe('SignupForm', () => {
  it('registers with the entered details and hands the result to the page', async () => {
    register.mockResolvedValue({ success: true, user: { id: '1' } })
    renderForm({ submitLabel: 'Create Account and Continue' })
    fill(); accept(); submit('Create Account and Continue')
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ success: true, user: { id: '1' } }))
    expect(register).toHaveBeenCalledWith('New Customer', 'new@example.com', '+923001234567', 'orchid-lantern-42')
  })

  it('shows a message next to each invalid field and sends nothing', () => {
    renderForm()
    fill({ 'Full Name': '', Password: 'short', 'Confirm Password': 'different', 'Phone Number': '123' })
    submit()
    expect(screen.getByText('Enter a valid full name using letters only.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid phone number with 10 to 15 digits.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(screen.getByText('Accept the Terms of Use and Privacy Notice to continue.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    expect(register).not.toHaveBeenCalled()
  })

  it('refuses a password that repeats the name or email before contacting the server', () => {
    renderForm()
    fill({ Password: 'newcustomer-2026', 'Confirm Password': 'newcustomer-2026' }); accept(); submit()
    expect(screen.getByText(/Do not use your name/)).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('guides the person while they type', () => {
    renderForm()
    const password = screen.getByLabelText('Password', { exact: true })
    expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument()
    fireEvent.change(password, { target: { value: 'abc' } })
    expect(screen.getByText('5 more characters needed.')).toBeInTheDocument()
    fireEvent.change(password, { target: { value: 'orchid-lantern-42' } })
    expect(screen.getByText(/Length is fine/)).toBeInTheDocument()
  })

  it('shows a server password rejection next to the password field and keeps what was typed', async () => {
    register.mockResolvedValue({ success: false, message: 'Too common', fieldErrors: { password: 'This password is too common. Choose something harder to guess.' } })
    renderForm()
    fill(); accept(); submit()
    expect(await screen.findByText('This password is too common. Choose something harder to guess.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toHaveValue('new@example.com')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('points an already-registered email at sign in and password reset', async () => {
    register.mockResolvedValue({ success: false, status: 409, message: 'Email already registered', fieldErrors: {} })
    renderForm()
    fill(); accept(); submit()
    expect(await screen.findByText(/already exists for this email/)).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows any other failure above the button and ignores a second click while sending', async () => {
    let finish
    register.mockReturnValue(new Promise(resolve => { finish = resolve }))
    renderForm()
    fill(); accept(); submit()
    const button = screen.getByRole('button', { name: /Creating account/ })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    fireEvent.submit(button.closest('form')) // Enter key in a field submits the form even though the button is disabled
    expect(register).toHaveBeenCalledTimes(1)
    finish({ success: false, message: 'Too many accounts were created from this connection. Please try again later.', fieldErrors: {} })
    expect(await screen.findByText(/Too many accounts were created/)).toBeInTheDocument()
  })
})
