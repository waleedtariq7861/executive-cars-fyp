import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PasswordField from './PasswordField.jsx'

describe('PasswordField', () => {
  it('hides the password until asked, and the toggle reports its state', () => {
    render(<PasswordField id="pw" label="Password" value="secret-pass-1" onChange={() => {}} />)
    const input = screen.getByLabelText('Password', { exact: true })
    expect(input).toHaveAttribute('type', 'password')
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('links the error to the field and shows it instead of the hint', () => {
    render(<PasswordField id="pw" label="Password" value="x" onChange={() => {}} hint="A hint" error="Too common" />)
    const input = screen.getByLabelText('Password', { exact: true })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'pw-error')
    expect(screen.getByRole('alert')).toHaveTextContent('Too common')
    expect(screen.queryByText('A hint')).not.toBeInTheDocument()
  })

  it('links the hint when there is no error and reports changes', () => {
    const onChange = vi.fn()
    render(<PasswordField id="pw" label="Password" value="" onChange={onChange} hint="At least 8 characters" />)
    const input = screen.getByLabelText('Password', { exact: true })
    expect(input).toHaveAttribute('aria-describedby', 'pw-hint')
    expect(input).not.toHaveAttribute('aria-invalid')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(onChange).toHaveBeenCalledWith('abc')
  })
})
