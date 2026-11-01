// Mirrors the rules the server enforces (see the backend's passwordPolicy.js) for instant feedback.
// The server stays the authority: it also rejects common and breached passwords.
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const compact = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

const personalWords = ({ email, name } = {}) => {
  const words = new Set(['executivecars'])
  const local = compact(String(email || '').split('@')[0])
  if (local.length >= 4) words.add(local)
  for (const part of String(name || '').split(/\s+/)) {
    const word = compact(part)
    if (word.length >= 5) words.add(word)
  }
  return [...words]
}

/** @returns {{ code: string, message: string } | null} the first rule the password breaks, or null */
export function passwordProblem(password, context = {}) {
  const length = [...String(password || '')].length
  if (length < PASSWORD_MIN_LENGTH) return { code: 'PASSWORD_TOO_SHORT', message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` }
  if (length > PASSWORD_MAX_LENGTH) return { code: 'PASSWORD_TOO_LONG', message: `Use at most ${PASSWORD_MAX_LENGTH} characters.` }
  const squashed = compact(password)
  if (personalWords(context).some(word => squashed.includes(word))) {
    return { code: 'PASSWORD_CONTAINS_PERSONAL', message: 'Do not use your name, your email or the site name in your password.' }
  }
  return null
}

/** Live guidance shown under a new-password field. */
export function passwordGuidance(password, context = {}) {
  const length = [...String(password || '')].length
  if (!length) return { tone: 'neutral', text: `At least ${PASSWORD_MIN_LENGTH} characters. A few unrelated words make a strong password.` }
  const problem = passwordProblem(password, context)
  if (problem?.code === 'PASSWORD_TOO_SHORT') {
    const missing = PASSWORD_MIN_LENGTH - length
    return { tone: 'neutral', text: `${missing} more character${missing === 1 ? '' : 's'} needed.` }
  }
  if (problem) return { tone: 'warning', text: problem.message }
  return { tone: 'good', text: 'Length is fine. We also check it against common and breached passwords.' }
}
