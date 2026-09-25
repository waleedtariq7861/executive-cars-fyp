import { describe, expect, it } from 'vitest'
import { shouldShowAIWidget } from '../App.jsx'

describe('AI assistant route policy', () => {
  it('keeps the assistant on focused marketplace entry points', () => {
    expect(shouldShowAIWidget('/')).toBe(true)
    expect(shouldShowAIWidget('/used-cars')).toBe(true)
    expect(shouldShowAIWidget('/price-predictor')).toBe(true)
    expect(shouldShowAIWidget('/sell-car')).toBe(true)
  })

  it.each([
    '/login', '/signup', '/privacy', '/terms', '/used-cars/car-id', '/saved-cars',
    '/auction', '/auction/payment', '/auction/dashboard', '/seller/dashboard',
    '/admin/login', '/admin/dashboard', '/missing-route',
  ])('suppresses the assistant on %s', pathname => {
    expect(shouldShowAIWidget(pathname)).toBe(false)
  })
})
