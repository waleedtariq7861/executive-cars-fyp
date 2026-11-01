import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api, { setCsrfToken } from './api.js'

const failWith = (status, data = {}) => async config => {
  const error = new Error(`HTTP ${status}`)
  error.response = { status, data, config, headers: {} }
  error.config = config
  throw error
}

describe('api interceptors', () => {
  let originalAdapter
  beforeEach(() => { originalAdapter = api.defaults.adapter })
  afterEach(() => {
    api.defaults.adapter = originalAdapter
    setCsrfToken('')
  })

  it('reports why a 401 happened so the app can explain the sign-out', async () => {
    const listener = vi.fn()
    window.addEventListener('ec:unauthorized', listener)
    api.defaults.adapter = failWith(401, { message: 'You were signed out.', code: 'SESSION_REVOKED' })
    await expect(api.get('/member/profile')).rejects.toThrow()
    window.removeEventListener('ec:unauthorized', listener)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0].detail).toEqual({ code: 'SESSION_REVOKED' })
  })

  it('does not treat other failures as a sign-out', async () => {
    const listener = vi.fn()
    window.addEventListener('ec:unauthorized', listener)
    for (const status of [400, 403, 429, 500]) {
      api.defaults.adapter = failWith(status)
      await expect(api.get('/anything')).rejects.toThrow()
    }
    window.removeEventListener('ec:unauthorized', listener)
    expect(listener).not.toHaveBeenCalled()
  })

  it('sends the CSRF token on state-changing requests only, and drops it after a 401', async () => {
    const seen = []
    api.defaults.adapter = async config => { seen.push({ method: config.method, csrf: config.headers['X-CSRF-Token'] }); return { data: {}, status: 200, statusText: 'OK', headers: {}, config } }
    setCsrfToken('csrf-1')
    await api.get('/auth/session')
    await api.post('/auth/logout')
    expect(seen).toEqual([{ method: 'get', csrf: undefined }, { method: 'post', csrf: 'csrf-1' }])

    api.defaults.adapter = failWith(401, { code: 'SESSION_EXPIRED' })
    await expect(api.post('/auth/logout')).rejects.toThrow()
    seen.length = 0
    api.defaults.adapter = async config => { seen.push(config.headers['X-CSRF-Token']); return { data: {}, status: 200, statusText: 'OK', headers: {}, config } }
    await api.post('/auth/logout')
    expect(seen).toEqual([undefined])
  })
})
