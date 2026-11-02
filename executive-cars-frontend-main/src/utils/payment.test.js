import { describe, expect, it } from 'vitest'
import { cardBrand, checkCard, checkTransfer, checkWallet, formatCardNumber, formatExpiry, formatMobile, formatMoney, luhnValid, parseExpiry } from './payment.js'

const NOW = new Date('2026-11-15T10:00:00Z')

describe('card helpers', () => {
  it('groups digits in fours (American Express 4-6-5) and drops everything else', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatCardNumber('4242-4242 4242abcd4242')).toBe('4242 4242 4242 4242')
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005')
    expect(formatCardNumber('42424242424242424242424')).toBe('4242 4242 4242 4242 424') // at most 19 digits
  })

  it('recognises the brand from the first digits', () => {
    expect(cardBrand('4242')).toBe('Visa')
    expect(cardBrand('5555')).toBe('Mastercard')
    expect(cardBrand('2221')).toBe('Mastercard')
    expect(cardBrand('3782')).toBe('American Express')
    expect(cardBrand('9999')).toBe('')
  })

  it('validates the Luhn checksum and length', () => {
    expect(luhnValid('4242424242424242')).toBe(true)
    expect(luhnValid('4242424242424241')).toBe(false)
    expect(luhnValid('4242')).toBe(false)
    expect(luhnValid('abcd')).toBe(false)
  })

  it('types the expiry as MM / YY and reads it back', () => {
    expect(formatExpiry('1')).toBe('1')
    expect(formatExpiry('12')).toBe('12')
    expect(formatExpiry('122')).toBe('12 / 2')
    expect(formatExpiry('1227')).toBe('12 / 27')
    expect(parseExpiry('12 / 27')).toEqual({ month: 12, year: 2027 })
    expect(parseExpiry('12 / 2')).toBeNull()
  })

  it('checks every card field and reports the first problem per field', () => {
    const good = { name: 'Test Customer', number: '4242 4242 4242 4242', expiry: '12 / 28', cvc: '123' }
    expect(checkCard(good, NOW)).toEqual({})
    expect(checkCard({ ...good, name: '' }, NOW).cardName).toBeTruthy()
    expect(checkCard({ ...good, number: '4242 4242 4242 4241' }, NOW).cardNumber).toBeTruthy()
    expect(checkCard({ ...good, expiry: '13 / 28' }, NOW).expiry).toMatch(/MM/)
    expect(checkCard({ ...good, expiry: '10 / 26' }, NOW).expiry).toMatch(/expired/)
    expect(checkCard({ ...good, expiry: '12 / 24' }, NOW).expiry).toMatch(/expired/)
    expect(checkCard({ ...good, expiry: '11 / 26' }, NOW)).toEqual({})
    expect(checkCard({ ...good, cvc: '12' }, NOW).cvc).toMatch(/3-digit/)
    expect(checkCard({ ...good, number: '3782 822463 10005', cvc: '123' }, NOW).cvc).toMatch(/4-digit/)
  })
})

describe('wallet and bank transfer helpers', () => {
  it('keeps wallet numbers to 11 digits and checks the format', () => {
    expect(formatMobile('0300-000 0001 99')).toBe('03000000001') // at most 11 digits
    expect(checkWallet({ provider: 'jazzcash', number: '03001234567' })).toEqual({})
    expect(checkWallet({ provider: '', number: '03001234567' }).walletProvider).toBeTruthy()
    expect(checkWallet({ provider: 'jazzcash', number: '12345' }).walletNumber).toBeTruthy()
    expect(checkWallet({ provider: 'jazzcash', number: '13001234567' }).walletNumber).toBeTruthy()
  })

  it('needs a transaction id and a date that is not in the future', () => {
    expect(checkTransfer({ reference: 'TXN-784512', date: '2026-11-14' }, NOW)).toEqual({})
    expect(checkTransfer({ reference: '12', date: '2026-11-14' }, NOW).bankReference).toBeTruthy()
    expect(checkTransfer({ reference: 'TXN-784512', date: '' }, NOW).transferDate).toBeTruthy()
    expect(checkTransfer({ reference: 'TXN-784512', date: '2026-12-30' }, NOW).transferDate).toMatch(/future/)
  })

  it('formats money with thousands separators', () => {
    expect(formatMoney(4999)).toBe('PKR 4,999')
    expect(formatMoney(1250000, 'PKR')).toBe('PKR 1,250,000')
  })
})
