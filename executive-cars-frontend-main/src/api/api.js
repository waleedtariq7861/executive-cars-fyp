import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
})

const SESSION_ENDED = new Set(['NOT_AUTHENTICATED', 'SESSION_EXPIRED', 'SESSION_REVOKED'])

let csrfToken = ''

export const setCsrfToken = token => {
  csrfToken = String(token || '')
}

api.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toLowerCase()
  if (csrfToken && !['get', 'head', 'options'].includes(method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only a 401 that says the session is gone signs the browser out; a failed sign-in is also a 401 but carries no code.
    const code = err.response?.data?.code
    if (err.response?.status === 401 && SESSION_ENDED.has(code)) {
      setCsrfToken('')
      // The code lets the app explain why (expired, revoked, never signed in).
      window.dispatchEvent(new CustomEvent('ec:unauthorized', { detail: { code } }))
    }
    return Promise.reject(err)
  }
)

export default api
