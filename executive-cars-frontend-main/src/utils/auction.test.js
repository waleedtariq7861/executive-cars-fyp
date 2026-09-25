import { describe, expect, it } from 'vitest'
import { bidValidationError, formatBidCount } from './auction.js'

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

describe('bid count copy', () => {
  it('uses correct singular and plural copy', () => {
    expect(formatBidCount(0)).toBe('0 bids')
    expect(formatBidCount(1)).toBe('1 bid')
    expect(formatBidCount(2)).toBe('2 bids')
  })
})
