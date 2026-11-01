import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
})

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
    if (err.response?.status === 401) {
      setCsrfToken('')
      // The server says why (SESSION_EXPIRED, SESSION_REVOKED, NOT_AUTHENTICATED) so the app can explain it.
      window.dispatchEvent(new CustomEvent('ec:unauthorized', { detail: { code: err.response?.data?.code } }))
    }
    return Promise.reject(err)
  }
)

export default api
