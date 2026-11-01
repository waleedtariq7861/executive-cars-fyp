import { describe, expect, it } from 'vitest'
import vercel from '../../vercel.json'

describe('vercel.json', () => {
  it('keeps the password-reset page out of Referer headers and caches', () => {
    const rule = vercel.headers.find(entry => entry.source === '/reset-password')
    const headers = Object.fromEntries(rule.headers.map(header => [header.key, header.value]))
    expect(headers['Referrer-Policy']).toBe('no-referrer')
    expect(headers['Cache-Control']).toBe('no-store')
  })

  it('still proxies the API and sockets and falls back to the single-page app', () => {
    const sources = vercel.rewrites.map(entry => entry.source)
    expect(sources).toEqual(['/api/:path*', '/socket.io/:path*', '/(.*)'])
  })
})
