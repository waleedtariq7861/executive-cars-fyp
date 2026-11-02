import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, Lock, KeyRound } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useAuth } from '../../context/authContext.js'
import SessionNotice from '../../components/auth/SessionNotice.jsx'
import useRetryCountdown from '../../hooks/useRetryCountdown.js'
import { waitLabel } from '../../utils/apiError.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { loginAdmin, completeAdminMfa } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Set once the password was right but the account also needs a code from the authenticator app.
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  // The server asks for a pause after too many failed attempts; it never locks the account for good.
  const [pauseMessage, setPauseMessage] = useState('')
  const retry = useRetryCountdown()
  const shownError = error || (retry.waiting ? pauseMessage : '')
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading || retry.waiting) return
    setLoading(true); setError(''); setPauseMessage('')
    const result = await loginAdmin(form.email, form.password)
    if (result.mfaRequired) {
      setChallenge(result.challenge)
      setLoading(false)
      return
    }
    if (result.success && result.role === 'admin') {
      navigate('/admin/dashboard')
    } else if (result.retryAfterSeconds) {
      setPauseMessage(result.message)
      retry.start(result.retryAfterSeconds)
    } else {
      setError(result.message || 'Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

  const handleCode = async (e) => {
    e.preventDefault()
    if (loading || retry.waiting) return
    if (!code.trim()) { setError('Enter the code from your authenticator app.'); return }
    setLoading(true); setError(''); setPauseMessage('')
    const result = await completeAdminMfa(challenge, code)
    if (result.success && result.role === 'admin') {
      navigate('/admin/dashboard')
      return
    }
    if (result.code === 'MFA_CHALLENGE_INVALID') {
      // The sign-in expired or used up its guesses: start again from the password.
      setChallenge(null); setCode(''); setForm(f => ({ ...f, password: '' }))
      setError(result.message)
    } else if (result.retryAfterSeconds) {
      setPauseMessage(result.message)
      retry.start(result.retryAfterSeconds)
    } else {
      setCode('')
      setError(result.fieldErrors?.code || result.message || 'That code did not work. Please try again.')
    }
    setLoading(false)
  }

  const backToPassword = () => { setChallenge(null); setCode(''); setError(''); setPauseMessage(''); setForm(f => ({ ...f, password: '' })) }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-3/5 bg-[#0f172a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-blue-400/8 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center h-full px-16">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <Logo className="w-10 h-10" />
            <div>
              <span className="text-white font-black text-xl block leading-none">Executive Cars</span>
              <span className="text-blue-400 text-xs font-medium">Admin Portal</span>
            </div>
          </Link>

          <Shield className="w-14 h-14 text-blue-400 mb-6" />
          <h2 className="text-4xl font-black text-white mb-3 leading-tight">
            Manage Everything<br /><span className="animated-gradient-text">From One Place</span>
          </h2>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">{challenge ? 'Two-step sign-in' : 'Admin Login'}</h2>
            <p className="text-gray-500 text-sm mt-1">{challenge ? 'Enter the code from your authenticator app' : 'Authorized personnel only'}</p>
          </div>

          <SessionNotice className="mb-5" />
          {challenge ? (
            <form onSubmit={handleCode} className="space-y-4" noValidate>
              <div>
                <label htmlFor="admin-code" className="block text-sm font-medium text-gray-700 mb-1.5">Authenticator code</label>
                <input id="admin-code" value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" inputMode="text" maxLength={14}
                  placeholder="123456" aria-invalid={shownError ? 'true' : undefined} aria-describedby={shownError ? 'admin-login-error' : 'admin-code-hint'}
                  className={`input-light text-center text-lg font-bold tracking-[0.3em] ${shownError ? 'border-red-400' : ''}`} />
                <p id="admin-code-hint" className="text-xs text-gray-500 mt-1.5">The 6-digit code changes every 30 seconds. Lost your phone? Type one of your recovery codes instead.</p>
              </div>
              {shownError && (
                <div id="admin-login-error" role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
                  {shownError}
                </div>
              )}
              <button type="submit" disabled={loading || retry.waiting}
                className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-60">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : retry.waiting ? <>Try again in {waitLabel(retry.seconds)}</> : <><KeyRound className="w-4 h-4" /> Verify and sign in</>}
              </button>
              <button type="button" onClick={backToPassword} className="block w-full text-center text-sm font-bold text-blue-700">Use a different account</button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input id="admin-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="username"
                aria-invalid={shownError ? 'true' : undefined} aria-describedby={shownError ? 'admin-login-error' : undefined}
                className={`input-light ${shownError ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label htmlFor="admin-password" className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-blue-700 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input id="admin-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required autoComplete="current-password"
                  aria-invalid={shownError ? 'true' : undefined} aria-describedby={shownError ? 'admin-login-error' : undefined}
                  className={`input-light pr-10 ${shownError ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {shownError && (
              <div id="admin-login-error" role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
                {shownError}
              </div>
            )}

            <button type="submit" disabled={loading || retry.waiting}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-200 disabled:opacity-60">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : retry.waiting
                  ? <>Try again in {waitLabel(retry.seconds)}</>
                  : <><Lock className="w-4 h-4" /> Sign In to Admin Portal</>
              }
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  )
}
