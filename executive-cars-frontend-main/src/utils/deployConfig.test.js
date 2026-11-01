import { describe, expect, it } from 'vitest'
import vercel from '../../vercel.json'

describe('vercel.json', () => {
  it('still proxies the API and sockets and falls back to the single-page app', () => {
    const sources = vercel.rewrites.map(entry => entry.source)
    expect(sources).toEqual(['/api/:path*', '/socket.io/:path*', '/(.*)'])
  })
})
