import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import api from '../api/api.js'
import Button from '../components/ui/Button.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import { FormField, Input } from '../components/ui/FormControls.jsx'
import PasswordField from '../components/auth/PasswordField.jsx'
import useRetryCountdown from '../hooks/useRetryCountdown.js'
import { readApiError, waitLabel } from '../utils/apiError.js'
import { passwordGuidance, passwordProblem } from '../utils/password.js'

const RESEND_WAIT_SECONDS = 60
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

// Second step of "Forgot password": the 6-digit code mailed to the account address plus the new password.
// The address arrives from the previous step in router state (never in the URL) and can be corrected here.
export default function ResetPasswordPage() {
  const arrival = useLocation().state
  const [form, setForm] = useState({ email: arrival?.email || '', code: '', password: '', confirm: '' })
  const [notice, setNotice] = useState(arrival?.message || '')
  const [developmentCode, setDevelopmentCode] = useState(arrival?.developmentCode || '')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [complete, setComplete] = useState(false)
  const resend = useRetryCountdown()
  const set = key => value => setForm(current => ({ ...current, [key]: value }))

  // A code that was just mailed means the first resend has to wait out the same minute.
  useEffect(() => { if (arrival?.message) resend.start(RESEND_WAIT_SECONDS) }, [])

  const sendNewCode = async () => {
    if (sending || resend.waiting) return
    setError(''); setFieldErrors({})
    const address = form.email.trim()
    if (!EMAIL_PATTERN.test(address)) return setFieldErrors({ email: 'Enter a valid email address.' })
    setSending(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: address })
      setNotice(data.message)
      setDevelopmentCode(data.developmentCode || '')
      setForm(current => ({ ...current, code: '' }))
      resend.start(RESEND_WAIT_SECONDS)
    } catch (requestError) {
      const failure = readApiError(requestError, 'Could not send a new code. Please try again.')
      setError(failure.message)
      if (failure.retryAfterSeconds) resend.start(failure.retryAfterSeconds)
    } finally {
      setSending(false)
    }
  }

  const submit = async event => {
    event.preventDefault()
    if (loading) return
    setError(''); setFieldErrors({})
    const address = form.email.trim()
    const digits = form.code.replace(/\s+/g, '')
    if (!EMAIL_PATTERN.test(address)) return setFieldErrors({ email: 'Enter a valid email address.' })
    if (!/^\d{6}$/.test(digits)) return setFieldErrors({ code: 'Enter the 6-digit code from the email.' })
    const problem = passwordProblem(form.password)
    if (problem) return setFieldErrors({ password: problem.message })
    if (form.password !== form.confirm) return setFieldErrors({ confirm: 'Passwords do not match.' })
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email: address, code: digits, password: form.password })
      setComplete(true)
    } catch (requestError) {
      const failure = readApiError(requestError, 'Could not reset password.')
      // A rejected password keeps the code valid, so show it next to the field and let the person try again.
      if (failure.fieldErrors.password) setFieldErrors({ password: failure.fieldErrors.password })
      else if (failure.code === 'RESET_CODE_INVALID') setFieldErrors({ code: failure.message })
      else if (failure.fieldErrors.code || failure.fieldErrors.email) setFieldErrors(failure.fieldErrors)
      else setError(failure.message)
    } finally {
      setLoading(false)
    }
  }

  const guidance = passwordGuidance(form.password)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-3 mb-7"><Logo className="w-10 h-10" /><span className="text-white font-black">Executive Cars</span></Link>
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-elevated">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">{complete ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}</div>
          <h1 className="text-2xl font-black text-gray-950 mt-5">{complete ? 'Password updated' : 'Choose a new password'}</h1>
          {complete ? (
            <><Alert tone="success" className="mt-5">Your password was reset. The code cannot be used again.</Alert><Button as={Link} to="/login" className="w-full mt-5">Sign in</Button></>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-6" noValidate>
              {notice && <Alert tone="success" title="Check your email">{notice} The code is valid for 10 minutes.</Alert>}
              {developmentCode && <Alert tone="warning" title="Local delivery">Your code is <strong className="tracking-widest">{developmentCode}</strong></Alert>}
              {error && <Alert tone="error">{error}</Alert>}
              <FormField label="Email address" htmlFor="reset-email" error={fieldErrors.email} required>
                <Input id="reset-email" type="email" autoComplete="email" value={form.email} error={fieldErrors.email} onChange={event => set('email')(event.target.value)} placeholder="you@example.com" />
              </FormField>
              <FormField label="6-digit code" htmlFor="reset-code" error={fieldErrors.code} required>
                <Input
                  id="reset-code" value={form.code} error={fieldErrors.code} inputMode="numeric" autoComplete="one-time-code"
                  maxLength={7} placeholder="123456" className="tracking-[0.4em] text-center text-lg font-bold"
                  onChange={event => set('code')(event.target.value.replace(/[^\d\s]/g, ''))}
                />
              </FormField>
              <PasswordField id="new-password" label="New password" value={form.password} onChange={set('password')} error={fieldErrors.password} hint={guidance.text} hintTone={guidance.tone} maxLength={128} />
              <PasswordField id="confirm-password" label="Confirm new password" value={form.confirm} onChange={set('confirm')} error={fieldErrors.confirm} maxLength={128} />
              <Button type="submit" loading={loading} className="w-full">Reset password</Button>
              <Button type="button" variant="outline" loading={sending} disabled={resend.waiting} onClick={sendNewCode} className="w-full">
                {resend.waiting ? `Send a new code in ${waitLabel(resend.seconds)}` : 'Send a new code'}
              </Button>
              <Link to="/login" className="block text-center text-sm font-bold text-blue-700">Back to sign in</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
