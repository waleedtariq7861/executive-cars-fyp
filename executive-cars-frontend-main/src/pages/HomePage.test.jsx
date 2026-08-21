import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage.jsx'
import { AuthContext } from '../context/authContext.js'

vi.mock('../api/api.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

describe('HomePage branding', () => {
  it('uses the official heading, slogan, and supporting description', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: () => {} }}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(
      screen.getByRole('heading', { level: 1, name: "Pakistan's Smart Automotive Marketplace" })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('From Inspection to Auction, Everything Smart.')
    ).toHaveLength(2)
    expect(
      screen.getByText('Buy, sell, inspect, value, and auction vehicles through one trusted platform designed for transparency, convenience, and smarter decisions.')
    ).toBeInTheDocument()
  })
})
