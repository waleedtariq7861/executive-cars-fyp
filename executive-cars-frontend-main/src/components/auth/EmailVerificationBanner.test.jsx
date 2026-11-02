import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../context/authContext.js'
import EmailVerificationBanner from './EmailVerificationBanner.jsx'

const renderBanner = user => render(
  <AuthContext.Provider value={{ user }}>
    <MemoryRouter initialEntries={['/account']}><EmailVerificationBanner /></MemoryRouter>
  </AuthContext.Provider>,
)

describe('EmailVerificationBanner', () => {
  it('reminds an unverified customer and links to the code page, returning to the current page afterwards', () => {
    renderBanner({ role: 'user', emailVerified: false })
    expect(screen.getByRole('status')).toHaveTextContent('Verify your email address to place bids and activate auction membership.')
    expect(screen.getByRole('link', { name: 'Verify email' })).toHaveAttribute('href', '/verify-email')
  })

  it.each([
    ['a verified customer', { role: 'user', emailVerified: true }],
    ['an older server that does not report verification', { role: 'user' }],
    ['an administrator', { role: 'admin' }],
    ['a visitor', null],
  ])('stays out of the way for %s', (_label, user) => {
    renderBanner(user)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
