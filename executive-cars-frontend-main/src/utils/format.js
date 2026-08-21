// src/utils/format.js
export function formatPKR(n) {
  const amount = Number(n)
  if (!Number.isFinite(amount)) return '—'
  return Math.round(amount).toLocaleString('en-PK')
}

export function formatPkr(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'PKR —'
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`
}

// Presentation-only rounding for customer-facing valuation intervals. Model
// values remain raw integers in the API; this avoids implying false precision.
export function formatMarketPkr(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'PKR —'
  if (amount >= 10_000_000) {
    const crores = Math.round((amount / 10_000_000) * 20) / 20
    return `PKR ${crores.toFixed(2)} Crore`
  }
  const lacs = Math.round((amount / 100_000) * (amount >= 1_000_000 ? 2 : 20)) / (amount >= 1_000_000 ? 2 : 20)
  return `PKR ${lacs.toFixed(amount >= 1_000_000 ? 1 : 2)} Lacs`
}
