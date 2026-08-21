const PERSON_NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u

export const sanitizePersonName = (value, maxLength = 80) => String(value ?? '')
  .replace(/[^\p{L}\p{M} .'-]/gu, '')
  .replace(/\s{2,}/g, ' ')
  .slice(0, maxLength)

export const isValidPersonName = value => {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ')
  return normalized.length >= 2
    && normalized.length <= 80
    && PERSON_NAME_PATTERN.test(normalized)
}

export const digitsOnly = (value, maxLength = Number.POSITIVE_INFINITY) => String(value ?? '')
  .replace(/\D/g, '')
  .slice(0, maxLength)

export const sanitizePhone = (value) => {
  const raw = String(value ?? '')
  const hasLeadingPlus = raw.trimStart().startsWith('+')
  const digits = digitsOnly(raw, 15)
  return `${hasLeadingPlus ? '+' : ''}${digits}`
}

export const isValidPhone = value => /^\+?\d{10,15}$/.test(String(value ?? ''))

export const sanitizeCnic = (value) => {
  const digits = digitsOnly(value, 13)
  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
}

export const isValidCnic = value => /^\d{5}-\d{7}-\d$/.test(String(value ?? ''))

export const numericInputProps = (maxLength) => ({
  type: 'text',
  inputMode: 'numeric',
  pattern: '[0-9]*',
  ...(maxLength ? { maxLength } : {}),
})
