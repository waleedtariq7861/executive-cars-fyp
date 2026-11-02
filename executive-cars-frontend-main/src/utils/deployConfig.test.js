import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import vercel from '../../vercel.json'

const pageHeaders = () => {
  const rule = vercel.headers.find(entry => entry.source.startsWith('/(('))
  return Object.fromEntries(rule.headers.map(header => [header.key, header.value]))
}
const directives = () => Object.fromEntries(pageHeaders()['Content-Security-Policy'].split(';').map(part => {
  const [name, ...values] = part.trim().split(/\s+/)
  return [name, values]
}))

describe('vercel.json', () => {
  it('proxies the API, sockets and locally stored images, and falls back to the single-page app', () => {
    const sources = vercel.rewrites.map(entry => entry.source)
    expect(sources).toEqual(['/api/:path*', '/socket.io/:path*', '/uploads/:path*', '/(.*)'])
    const destinations = vercel.rewrites.slice(0, 3).map(entry => new URL(entry.destination).origin)
    expect(new Set(destinations).size).toBe(1)
  })

  it('puts the security headers on the pages but not on the proxied API, sockets and images', () => {
    const rule = vercel.headers[0]
    const matches = path => new RegExp(`^${rule.source}$`).test(path)
    expect(matches('/')).toBe(true)
    expect(matches('/admin/login')).toBe(true)
    expect(matches('/assets/index-abc.js')).toBe(true)
    for (const proxied of ['/api/auth/login', '/socket.io/', '/uploads/images/a.jpg']) expect(matches(proxied)).toBe(false)
    expect(Object.keys(pageHeaders())).toEqual(expect.arrayContaining([
      'Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security',
    ]))
    expect(pageHeaders()['X-Content-Type-Options']).toBe('nosniff')
    expect(pageHeaders()['X-Frame-Options']).toBe('DENY')
  })

  it('has a content security policy that allows no inline or injected script and no framing', () => {
    const policy = directives()
    expect(policy['default-src']).toEqual(["'self'"])
    expect(policy['script-src']).toEqual(["'self'"])
    expect(policy['style-src']).toEqual(["'self'"])
    expect(policy['object-src']).toEqual(["'none'"])
    expect(policy['frame-src']).toEqual(["'none'"])
    expect(policy['frame-ancestors']).toEqual(["'none'"])
    expect(policy['base-uri']).toEqual(["'self'"])
    expect(policy['form-action']).toEqual(["'self'"])
    expect(policy['connect-src']).toEqual(["'self'"])
    expect(policy['font-src']).toEqual(["'self'"])
    expect(policy).toHaveProperty('upgrade-insecure-requests')
    for (const [name, values] of Object.entries(policy)) {
      if (name === 'upgrade-insecure-requests') continue
      expect(values, name).not.toContain("'unsafe-inline'")
      expect(values, name).not.toContain("'unsafe-eval'")
      expect(values, name).not.toContain('*')
    }
  })

  it('lets images come only from this site, inline data, and the image host', () => {
    expect(directives()['img-src']).toEqual(["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'])
  })
})

describe('index.html', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

  it('has no inline script or style, which the policy would block', () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i)
    expect(html).not.toMatch(/<style/i)
    expect(html).not.toMatch(/\son[a-z]+\s*=/i)
  })

  it('loads nothing from another site: the typeface is served from this one', () => {
    expect(html).not.toMatch(/https?:\/\//i)
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i)
  })
})
