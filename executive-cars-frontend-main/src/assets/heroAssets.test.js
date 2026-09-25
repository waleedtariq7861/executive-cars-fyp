import { describe, expect, it } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const asset = name => fileURLToPath(new URL(name, import.meta.url))

describe('responsive hero asset budget', () => {
  it('keeps mobile and desktop modern assets within the release budget', () => {
    expect(statSync(asset('./executive-cars-hero-640.avif')).size).toBeLessThan(150_000)
    expect(statSync(asset('./executive-cars-hero-1746.avif')).size).toBeLessThan(350_000)
    expect(statSync(asset('./executive-cars-hero-640.webp')).size).toBeLessThan(150_000)
    expect(statSync(asset('./executive-cars-hero-1746.webp')).size).toBeLessThan(350_000)
  })

  it('does not import the original PNG into the homepage bundle', () => {
    const homeSource = readFileSync(resolve(process.cwd(), 'src/pages/HomePage.jsx'), 'utf8')
    expect(homeSource).not.toContain("executive-cars-hero.png")
    expect(homeSource).toContain('image/avif')
    expect(homeSource).toContain('image/webp')
  })
})
