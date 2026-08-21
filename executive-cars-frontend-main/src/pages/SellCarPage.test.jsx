import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SellCarPage from './SellCarPage.jsx'
import { AuthContext } from '../context/authContext.js'

describe('SellCarPage', () => {
  it('shows only the managed selling service and links to protected inspection booking', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: () => {} }}>
        <MemoryRouter>
          <SellCarPage />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.queryByText('Sell It Myself')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sell It For Me' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Book an Inspection/i })).toHaveAttribute(
      'href',
      '/seller/book-inspection'
    )
  })
})
