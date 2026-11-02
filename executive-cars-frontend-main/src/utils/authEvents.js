// Plain-language names for the security events the server records, and the ways of filtering them for administrators.
export const EVENT_LABELS = {
  registered: 'Account created',
  login_success: 'Signed in',
  login_failure: 'Failed sign-in attempt',
  logout: 'Signed out',
  password_changed: 'Password changed',
  reset_requested: 'Password reset requested',
  reset_completed: 'Password reset completed',
  email_verified: 'Email address verified',
  session_revoked: 'Signed out other devices',
  mail_failed: 'Email could not be delivered',
  mfa_enabled: 'Two-step sign-in turned on',
  mfa_disabled: 'Two-step sign-in turned off',
  mfa_failed: 'Wrong two-step code',
  recovery_code_used: 'Recovery code used',
  recovery_codes_regenerated: 'New recovery codes made',
}

export const eventLabel = type => EVENT_LABELS[type] || type

// Events a person should look at twice when they did not cause them.
export const NEEDS_ATTENTION = new Set(['login_failure', 'mail_failed', 'reset_requested', 'mfa_failed', 'mfa_disabled', 'recovery_code_used'])

export const ADMIN_FILTERS = [
  ['', 'All events'],
  ['login_failure', 'Failed sign-ins'],
  ['mail_failed', 'Emails not delivered'],
  ['reset_requested', 'Password reset requests'],
  ['mfa_failed', 'Wrong two-step codes'],
  ['reset_completed', 'Password resets completed'],
  ['password_changed', 'Password changes'],
  ['login_success', 'Sign-ins'],
]

export const formatWhen = value => (value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
