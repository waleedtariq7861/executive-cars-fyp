import { describe, expect, it } from 'vitest'

// Guards against explanation text that was deliberately removed from the interface coming back:
// developer wording shown to customers, descriptions of how accounts are modelled, demo-mechanics
// notes, and repeated disclaimers. Scans the source of every non-test module.
const sources = Object.entries(import.meta.glob('/src/**/*.{js,jsx}', { query: '?raw', import: 'default', eager: true }))
  .filter(([file]) => !/\.test\.|\/src\/test\//.test(file))

const removed = [
  'backend API is running',
  'Age at dataset year',
  'Model reference year',
  'collected June 2026',
  'Unified Account',
  'Unified customer account',
  'Financial status',
  'No members found',
  'One account for everything',
  'customer identity',
  'The same login works',
  'One Executive Cars login works',
  'One identity, separate capabilities',
  'Auction membership uses this same account',
  'One account lets you buy',
  'Use the same account to track',
  'existing managed-selling process',
  'seller portal.',
  'securely linked',
  'Local FYP demonstration',
  'Email delivery is simulated locally',
  'Local email delivery is unavailable',
  'production never exposes the code',
  'Predictions can still use local marketplace comparables',
  'immutable dataset',
  'historical provenance',
  'Demonstration Mode',
  'Demonstration plan value',
  'No financial transaction occurs',
  'does not collect card details, charge money',
  'Inspect the vehicle, verify original documents',
  'Please review this action before continuing',
  "Here's what's happening",
  'Track your vehicle inspection requests',
  'Outbid updates appear here',
  'Seller approval follows car verification',
  'Available after car verification',
  'Seller Login',
  'No separate buyer or seller registration',
  'No buyer/seller role selection',
]

describe('removed explanation copy stays removed', () => {
  it('scans a real set of modules', () => {
    expect(sources.length).toBeGreaterThan(50)
  })

  it.each(removed)('%s is not in any source file', phrase => {
    const offenders = sources.filter(([, text]) => text.includes(phrase)).map(([file]) => file)
    expect(offenders).toEqual([])
  })
})
