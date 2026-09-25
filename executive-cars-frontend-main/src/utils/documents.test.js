import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { openProtectedDocument } from './documents.js'

vi.mock('../api/api.js', () => ({
  default: { get: vi.fn() },
}))

describe('openProtectedDocument', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    api.get.mockReset()
  })

  it('opens a window synchronously before requesting the protected URL', async () => {
    const events = []
    const replace = vi.fn()
    const documentWindow = { opener: window, location: { replace }, close: vi.fn() }
    vi.spyOn(window, 'open').mockImplementation(() => {
      events.push('open')
      return documentWindow
    })
    api.get.mockImplementation(async () => {
      events.push('request')
      return { data: { url: 'https://documents.example/report', expiresAt: '2026-09-16T00:00:00.000Z' } }
    })

    const result = await openProtectedDocument('/documents/products/1/report')

    expect(events).toEqual(['open', 'request'])
    expect(documentWindow.opener).toBeNull()
    expect(replace).toHaveBeenCalledWith('https://documents.example/report')
    expect(result.url).toBe('https://documents.example/report')
  })

  it('does not request a link when the browser blocks the window', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    await expect(openProtectedDocument('/documents/products/1/report')).rejects.toThrow(/blocked/i)
    expect(api.get).not.toHaveBeenCalled()
  })

  it('closes the blank window when authorization fails', async () => {
    const close = vi.fn()
    vi.spyOn(window, 'open').mockReturnValue({ opener: window, location: { replace: vi.fn() }, close })
    api.get.mockRejectedValue(new Error('Forbidden'))

    await expect(openProtectedDocument('/documents/products/1/report')).rejects.toThrow('Forbidden')
    expect(close).toHaveBeenCalledOnce()
  })
})
