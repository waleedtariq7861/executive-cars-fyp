import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { isSafeDocumentUrl, openProtectedDocument } from './documents.js'

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

  it.each([
    'javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd', 'http://evil.example/report.pdf', 'blob:https://x.example/1',
  ])('refuses to navigate to %s and closes the blank window', async link => {
    const close = vi.fn()
    const replace = vi.fn()
    vi.spyOn(window, 'open').mockReturnValue({ opener: window, location: { replace }, close })
    api.get.mockResolvedValue({ data: { url: link } })

    await expect(openProtectedDocument('/documents/products/1/report')).rejects.toThrow(/not valid/)
    expect(replace).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledOnce()
  })

  it('closes the blank window when authorization fails', async () => {
    const close = vi.fn()
    vi.spyOn(window, 'open').mockReturnValue({ opener: window, location: { replace: vi.fn() }, close })
    api.get.mockRejectedValue(new Error('Forbidden'))

    await expect(openProtectedDocument('/documents/products/1/report')).rejects.toThrow('Forbidden')
    expect(close).toHaveBeenCalledOnce()
  })
})

describe('isSafeDocumentUrl', () => {
  it('accepts secure addresses, this site and local development, and nothing else', () => {
    for (const ok of ['https://res.cloudinary.com/demo/raw/authenticated/x.pdf', `${window.location.origin}/api/documents/access/token`, 'http://127.0.0.1:5082/api/documents/access/t', 'http://localhost:5082/a', '/api/documents/access/t']) {
      expect(isSafeDocumentUrl(ok), ok).toBe(true)
    }
    for (const bad of ['http://evil.example/a.pdf', 'javascript:alert(1)', 'data:text/plain,hi', 'ftp://x.example/a', '', 'http://', undefined, null]) {
      expect(isSafeDocumentUrl(bad), String(bad)).toBe(false)
    }
  })
})
