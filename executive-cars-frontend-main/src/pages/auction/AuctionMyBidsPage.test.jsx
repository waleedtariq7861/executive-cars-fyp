import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AuctionMyBidsPage from './AuctionMyBidsPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn() } }))
vi.mock('../../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'member-1' } }) }))
vi.mock('../../components/AuctionLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../components/VehicleImage.jsx', () => ({ default: ({ alt }) => <span>{alt} image</span> }))

describe('AuctionMyBidsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not present zero statistics or an empty state while bids are loading', async () => {
    let resolveRequest
    api.get.mockReturnValue(new Promise(resolve => { resolveRequest = resolve }))
    render(<MemoryRouter><AuctionMyBidsPage /></MemoryRouter>)

    expect(screen.getByText('Loading bids...')).toBeInTheDocument()
    expect(screen.getByText('Total Bids').parentElement).toHaveTextContent('—')
    expect(screen.queryByText('No bids in this category.')).not.toBeInTheDocument()

    resolveRequest({ data: [] })
    expect(await screen.findByText('No bids in this category.')).toBeInTheDocument()
    expect(screen.getByText('Total Bids').parentElement).toHaveTextContent('0')
  })
})
