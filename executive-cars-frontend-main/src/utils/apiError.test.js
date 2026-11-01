import { describe, expect, it } from 'vitest'
import { readApiError, waitLabel } from './apiError.js'

const failure = (status, data, headers = {}) => ({ response: { status, data, headers } })

describe('readApiError', () => {
  it('reads message, code and per-field errors from the response body', () => {
    const result = readApiError(failure(400, { message: 'Too common', code: 'PASSWORD_COMMON', errors: { password: 'Too common' } }))
    expect(result).toMatchObject({ message: 'Too common', code: 'PASSWORD_COMMON', status: 400, fieldErrors: { password: 'Too common' }, retryAfterSeconds: 0 })
  })

  it('prefers the body wait time and falls back to the Retry-After header', () => {
    expect(readApiError(failure(429, { message: 'Slow down', retryAfterSeconds: 12 }, { 'retry-after': '99' })).retryAfterSeconds).toBe(12)
    expect(readApiError(failure(429, { message: 'Slow down' }, { 'retry-after': '30' })).retryAfterSeconds).toBe(30)
    expect(readApiError(failure(429, { message: 'Slow down' }, { 'retry-after': 'soon' })).retryAfterSeconds).toBe(0)
  })

  it('falls back to the supplied message when there is no usable response', () => {
    expect(readApiError(new Error('Network Error'), 'Sign in failed').message).toBe('Sign in failed')
    expect(readApiError(failure(500, '<html>oops</html>'), 'Sign in failed').message).toBe('Sign in failed')
    expect(readApiError(undefined).fieldErrors).toEqual({})
  })

  it('ignores malformed field errors', () => {
    expect(readApiError(failure(400, { errors: ['a', 'b'] })).fieldErrors).toEqual({})
    expect(readApiError(failure(400, { errors: 'nope' })).fieldErrors).toEqual({})
  })
})

describe('waitLabel', () => {
  it('uses seconds under two minutes and minutes after that', () => {
    expect(waitLabel(1)).toBe('1 second')
    expect(waitLabel(45)).toBe('45 seconds')
    expect(waitLabel(119)).toBe('119 seconds')
    expect(waitLabel(900)).toBe('15 minutes')
    expect(waitLabel(-3)).toBe('0 seconds')
  })
})
