import { describe, expect, it } from 'vitest'
import { bidValidationError } from './auction.js'

describe('bid validation', () => {
  it('rejects closed, negative, and low bids', () => {
    expect(bidValidationError({ amount: 5000000, minimumBid: 4500000, auctionEnded: true })).toMatch(/ended/i)
    expect(bidValidationError({ amount: -1, minimumBid: 4500000 })).toMatch(/positive/i)
    expect(bidValidationError({ amount: 4400000, minimumBid: 4500000 })).toMatch(/minimum bid/i)
  })

  it('accepts a bid at the minimum', () => {
    expect(bidValidationError({ amount: 4500000, minimumBid: 4500000 })).toBe('')
  })
})
