import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { AuthContext } from '../context/authContext.js'
import { useSavedCars } from './useSavedCars.js'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

function Probe() {
  const { savedIds, syncing } = useSavedCars()
  return <p>{syncing ? 'syncing' : `saved: ${savedIds.join(',') || 'none'}`}</p>
}
const renderAs = user => render(<AuthContext.Provider value={{ user }}><Probe /></AuthContext.Provider>)

describe('useSavedCars guest merge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('moves guest saves into the account when a member signs in, then clears them', async () => {
    localStorage.setItem('ec_wishlist', JSON.stringify(['car-a', 'car-b']))
    api.post.mockResolvedValue({ data: {} })
    api.get.mockResolvedValue({ data: { cars: [{ _id: 'car-a' }, { _id: 'car-b' }, { _id: 'car-old' }] } })

    renderAs({ id: 'm1', role: 'user' })

    expect(await screen.findByText('saved: car-a,car-b,car-old')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/member/saved-cars/car-a')
    expect(api.post).toHaveBeenCalledWith('/member/saved-cars/car-b')
    expect(localStorage.getItem('ec_wishlist')).toBeNull()
  })

  it('still loads the account list when a guest save is no longer valid', async () => {
    localStorage.setItem('ec_wishlist', JSON.stringify(['deleted-car']))
    api.post.mockRejectedValue({ response: { status: 404 } })
    api.get.mockResolvedValue({ data: { cars: [{ _id: 'car-old' }] } })

    renderAs({ id: 'm1', role: 'user' })

    expect(await screen.findByText('saved: car-old')).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem('ec_wishlist')).toBeNull())
  })

  it('leaves guest saves in the browser for signed-out visitors', async () => {
    localStorage.setItem('ec_wishlist', JSON.stringify(['car-a']))
    renderAs(null)
    expect(await screen.findByText('saved: car-a')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    expect(localStorage.getItem('ec_wishlist')).not.toBeNull()
  })
})
