// Turns a failed API call into the pieces the screens need: a message, the machine-readable code,
// per-field messages (`errors` in the response body) and how long to wait before retrying.
const positive = value => (Number.isFinite(value) && value > 0 ? Math.ceil(value) : 0)

export function readApiError(error, fallback = 'Something went wrong. Please try again.') {
  const response = error?.response
  const data = response?.data && typeof response.data === 'object' ? response.data : {}
  const retryAfterSeconds = positive(Number(data.retryAfterSeconds)) || positive(Number.parseInt(response?.headers?.['retry-after'], 10))
  const fieldErrors = data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors) ? data.errors : {}
  return {
    message: typeof data.message === 'string' && data.message ? data.message : fallback,
    code: typeof data.code === 'string' ? data.code : undefined,
    status: response?.status,
    fieldErrors,
    retryAfterSeconds,
  }
}

export function waitLabel(seconds) {
  const total = Math.max(0, Math.ceil(seconds))
  if (total < 120) return `${total} second${total === 1 ? '' : 's'}`
  return `${Math.ceil(total / 60)} minutes`
}
