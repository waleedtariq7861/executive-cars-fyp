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
    localStorage.setItem('ec_wishlist', JSON.stringify(['a1a1a1a1a1a1a1a1a1a1a1a1', 'b2b2b2b2b2b2b2b2b2b2b2b2']))
    api.post.mockResolvedValue({ data: {} })
    api.get.mockResolvedValue({ data: { cars: [{ _id: 'a1a1a1a1a1a1a1a1a1a1a1a1' }, { _id: 'b2b2b2b2b2b2b2b2b2b2b2b2' }, { _id: 'c3c3c3c3c3c3c3c3c3c3c3c3' }] } })

    renderAs({ id: 'm1', role: 'user' })

    expect(await screen.findByText('saved: a1a1a1a1a1a1a1a1a1a1a1a1,b2b2b2b2b2b2b2b2b2b2b2b2,c3c3c3c3c3c3c3c3c3c3c3c3')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/member/saved-cars/a1a1a1a1a1a1a1a1a1a1a1a1')
    expect(api.post).toHaveBeenCalledWith('/member/saved-cars/b2b2b2b2b2b2b2b2b2b2b2b2')
    expect(localStorage.getItem('ec_wishlist')).toBeNull()
  })

  it('still loads the account list when a guest save is no longer valid', async () => {
    localStorage.setItem('ec_wishlist', JSON.stringify(['d4d4d4d4d4d4d4d4d4d4d4d4']))
    api.post.mockRejectedValue({ response: { status: 404 } })
    api.get.mockResolvedValue({ data: { cars: [{ _id: 'c3c3c3c3c3c3c3c3c3c3c3c3' }] } })

    renderAs({ id: 'm1', role: 'user' })

    expect(await screen.findByText('saved: c3c3c3c3c3c3c3c3c3c3c3c3')).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem('ec_wishlist')).toBeNull())
  })

  it('keeps guest saves that could not be delivered and drops the ones the server rejected', async () => {
    localStorage.setItem('ec_wishlist', JSON.stringify(['e5e5e5e5e5e5e5e5e5e5e5e5', 'f6f6f6f6f6f6f6f6f6f6f6f6', 'd4d4d4d4d4d4d4d4d4d4d4d4', '071707170717071707170717']))
    api.post.mockImplementation(url => {
      if (url.endsWith('e5e5e5e5e5e5e5e5e5e5e5e5')) return Promise.reject(new Error('Network Error'))
      if (url.endsWith('f6f6f6f6f6f6f6f6f6f6f6f6')) return Promise.reject({ response: { status: 503 } })
      if (url.endsWith('d4d4d4d4d4d4d4d4d4d4d4d4')) return Promise.reject({ response: { status: 404 } })
      return Promise.resolve({ data: {} })
    })
    api.get.mockResolvedValue({ data: { cars: [{ _id: '071707170717071707170717' }] } })

    renderAs({ id: 'm1', role: 'user' })

    expect(await screen.findByText('saved: 071707170717071707170717')).toBeInTheDocument()
    await waitFor(() => expect(JSON.parse(localStorage.getItem('ec_wishlist'))).toEqual(['e5e5e5e5e5e5e5e5e5e5e5e5', 'f6f6f6f6f6f6f6f6f6f6f6f6']))
  })

  it('leaves guest saves in the browser for signed-out visitors', async () => {
    localStorage.setItem('ec_wishlist', JSON.stringify(['a1a1a1a1a1a1a1a1a1a1a1a1']))
    renderAs(null)
    expect(await screen.findByText('saved: a1a1a1a1a1a1a1a1a1a1a1a1')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    expect(localStorage.getItem('ec_wishlist')).not.toBeNull()
  })

  it('records a failed load as an error the page can show, without throwing', async () => {
    api.get.mockRejectedValue({ response: { status: 500, data: { message: 'Saved cars could not be loaded.' } } })
    let hook
    function Capture() { hook = useSavedCars(); return <p>{hook.error || 'no error'}</p> }
    render(<AuthContext.Provider value={{ user: { id: 'm1', role: 'user' } }}><Capture /></AuthContext.Provider>)
    expect(await screen.findByText('Saved cars could not be loaded.')).toBeInTheDocument()
    await expect(hook.reload()).resolves.toBeNull()
  })
})

describe('useSavedCars browser storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('uses only real record ids from storage, so nothing odd ends up in a request path', async () => {
    const valid = '0123456789abcdef01234567'
    localStorage.setItem('ec_wishlist', JSON.stringify(['../../auth/logout', 'x', 123, null, {}, ['a'], valid, `${valid}/extra`, valid.toUpperCase()]))
    api.post.mockResolvedValue({ data: {} })
    api.get.mockResolvedValue({ data: { cars: [] } })

    renderAs({ id: 'm1', role: 'user' })

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/member/saved-cars'))
    expect(api.post.mock.calls.map(call => call[0]).sort()).toEqual([`/member/saved-cars/${valid}`, `/member/saved-cars/${valid.toUpperCase()}`].sort())
  })

  it('treats damaged storage as empty', async () => {
    localStorage.setItem('ec_wishlist', '{not json')
    renderAs(null)
    expect(await screen.findByText('saved: none')).toBeInTheDocument()
    localStorage.setItem('ec_wishlist', JSON.stringify({ not: 'a list' }))
    renderAs(null)
    expect((await screen.findAllByText('saved: none')).length).toBeGreaterThan(0)
  })
})
