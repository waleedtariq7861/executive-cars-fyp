import { describe, expect, it } from 'vitest'
import {
  digitsOnly,
  isValidCnic,
  isValidPersonName,
  isValidPhone,
  sanitizeCnic,
  sanitizePersonName,
  sanitizePhone,
} from './inputValidation.js'

describe('input validation helpers', () => {
  it('removes numbers and symbols from names while preserving real name separators and Urdu letters', () => {
    expect(sanitizePersonName("Ali123 O'Neil@")).toBe("Ali O'Neil")
    expect(sanitizePersonName('محمد 123 علی')).toBe('محمد علی')
    expect(isValidPersonName('Muhammad Ali')).toBe(true)
    expect(isValidPersonName('Ali 123')).toBe(false)
  })

  it('keeps only phone digits and an optional leading plus', () => {
    expect(sanitizePhone('+92 300-ABC-1234567')).toBe('+923001234567')
    expect(isValidPhone('+923001234567')).toBe(true)
    expect(isValidPhone('phone123')).toBe(false)
  })

  it('formats CNIC digits and rejects alphabetic CNIC values', () => {
    expect(sanitizeCnic('35202abc1234567x1')).toBe('35202-1234567-1')
    expect(isValidCnic('35202-1234567-1')).toBe(true)
    expect(isValidCnic('3520A-1234567-1')).toBe(false)
  })

  it('blocks exponent signs and letters in integer inputs', () => {
    expect(digitsOnly('1e5-+abc')).toBe('15')
  })
})
