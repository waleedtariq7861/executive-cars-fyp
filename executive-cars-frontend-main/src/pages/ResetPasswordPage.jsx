import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import api from '../api/api.js'
import Button from '../components/ui/Button.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import PasswordField from '../components/auth/PasswordField.jsx'
import { readApiError } from '../utils/apiError.js'
import { passwordGuidance, passwordProblem } from '../utils/password.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  // The link's token is read once and kept in memory; the address bar, history and any later request's Referer
  // header must not carry it.
  const [token] = useState(() => searchParams.get('token') || '')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash)
    const meta = document.createElement('meta')
    meta.name = 'referrer'
    meta.content = 'no-referrer'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const submit = async event => {
    event.preventDefault()
    setError(''); setFieldErrors({})
    if (!token) return setError('This reset link is incomplete.')
    const problem = passwordProblem(form.password)
    if (problem) return setFieldErrors({ password: problem.message })
    if (form.password !== form.confirm) return setFieldErrors({ confirm: 'Passwords do not match.' })
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setComplete(true)
    } catch (requestError) {
      const failure = readApiError(requestError, 'Could not reset password.')
      // A rejected password keeps the link valid, so show it next to the field and let the person try again.
      if (failure.fieldErrors.password) setFieldErrors({ password: failure.fieldErrors.password })
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
            <><Alert tone="success" className="mt-5">Your password was reset. The reset link cannot be used again.</Alert><Button as={Link} to="/login" className="w-full mt-5">Sign in</Button></>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-6">
              {error && <Alert tone="error">{error}</Alert>}
              <PasswordField id="new-password" label="New password" value={form.password} onChange={value => setForm(current => ({ ...current, password: value }))} error={fieldErrors.password} hint={guidance.text} hintTone={guidance.tone} maxLength={128} />
              <PasswordField id="confirm-password" label="Confirm new password" value={form.confirm} onChange={value => setForm(current => ({ ...current, confirm: value }))} error={fieldErrors.confirm} maxLength={128} />
              <Button type="submit" loading={loading} className="w-full">Reset password</Button>
              <Link to="/forgot-password" className="block text-center text-sm font-bold text-blue-700">Request a new link</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
