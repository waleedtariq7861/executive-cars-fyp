import { formatPKR } from './format.js'

export function formatBidCount(count) {
  const value = Number.isFinite(Number(count)) ? Number(count) : 0
  return `${value} bid${value === 1 ? '' : 's'}`
}

export function bidValidationError({ amount, minimumBid, auctionEnded = false, auctionNotStarted = false }) {
  if (auctionEnded) return 'This auction has ended.'
  if (auctionNotStarted) return 'This auction has not started yet.'
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 'Enter a valid positive bid amount.'
  if (numericAmount < minimumBid) return `Minimum bid is PKR ${formatPKR(minimumBid)}`
  return ''
}
