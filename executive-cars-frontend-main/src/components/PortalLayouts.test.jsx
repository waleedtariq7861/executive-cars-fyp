import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AdminLayout from './AdminLayout.jsx'
import AuctionLayout from './AuctionLayout.jsx'
import SellerLayout from './SellerLayout.jsx'

const logout = vi.fn()
vi.mock('../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'u1', name: 'Test Member', role: 'user' }, logout }) }))

const cases = [
  ['AdminLayout', AdminLayout, '/admin/dashboard', 'admin-sidebar'],
  ['AuctionLayout', AuctionLayout, '/auction/dashboard', 'auction-sidebar'],
  ['SellerLayout', SellerLayout, '/seller/dashboard', 'seller-sidebar'],
]

describe.each(cases)('%s', (_name, Layout, path, sidebarId) => {
  const renderLayout = () => render(<MemoryRouter initialEntries={[path]}><Layout title="Page"><p>Body</p></Layout></MemoryRouter>)

  it('keeps the closed mobile sidebar out of the tab order and names its toggle', () => {
    renderLayout()
    const sidebar = document.getElementById(sidebarId)
    expect(sidebar).toHaveClass('invisible', 'lg:visible') // hidden below lg, visible on desktop

    const toggle = screen.getByRole('button', { name: 'Open navigation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', sidebarId)

    fireEvent.click(toggle)
    expect(sidebar).not.toHaveClass('invisible')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName('Close navigation')
  })

  it('marks the current page and has no decorative notification bell', () => {
    renderLayout()
    expect(document.querySelector('[aria-current="page"]')).not.toBeNull()
    expect(document.querySelector('header .lucide-bell')).toBeNull()
  })
})

describe('AuctionLayout', () => {
  it('keeps Live Auctions highlighted on an individual auction page', () => {
    render(<MemoryRouter initialEntries={['/auction/car/abc123']}><AuctionLayout title="Car"><p>Body</p></AuctionLayout></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Live Auctions' })).toHaveAttribute('aria-current', 'page')
  })
})

describe.each([
  ['AdminLayout', AdminLayout, '/admin/dashboard', '/admin'],
  ['AuctionLayout', AuctionLayout, '/auction/dashboard', '/auction'],
  ['SellerLayout', SellerLayout, '/seller/dashboard', '/login'],
])('%s sign out', (_name, Layout, path, destination) => {
  it('asks the auth context to land on the public page after signing out', () => {
    logout.mockClear()
    render(<MemoryRouter initialEntries={[path]}><Layout title="Page"><p>Body</p></Layout></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(logout).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith(destination)
  })
})
