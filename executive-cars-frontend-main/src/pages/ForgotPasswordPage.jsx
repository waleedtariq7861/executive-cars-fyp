import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import api from '../api/api.js'
import Button from '../components/ui/Button.jsx'
import { FormField, Input } from '../components/ui/FormControls.jsx'
import useRetryCountdown from '../hooks/useRetryCountdown.js'
import { readApiError, waitLabel } from '../utils/apiError.js'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pauseMessage, setPauseMessage] = useState('')
  const retry = useRetryCountdown()
  const shownError = error || (retry.waiting ? pauseMessage : '')

  const submit = async event => {
    event.preventDefault()
    if (loading || retry.waiting) return
    setError(''); setPauseMessage('')
    const address = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError('Enter a valid email address.')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: address })
      // The answer is the same whether or not the address has an account; the next page is where the code is entered.
      navigate('/reset-password', { state: { email: address, message: data.message, developmentCode: data.developmentCode } })
    } catch (requestError) {
      const failure = readApiError(requestError, 'Could not process the request. Please try again.')
      if (failure.retryAfterSeconds) {
        setPauseMessage(failure.message)
        retry.start(failure.retryAfterSeconds)
      } else setError(failure.fieldErrors.email || failure.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-3 mb-7"><Logo className="w-10 h-10" /><span className="text-white font-black">Executive Cars</span></Link>
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-elevated">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Mail className="w-6 h-6" /></div>
          <h1 className="text-2xl font-black text-gray-950 mt-5">Reset your password</h1>
          <p className="text-sm text-gray-500 leading-6 mt-2">Enter the email address of your account and we will send you a 6-digit code.</p>
          <form onSubmit={submit} className="mt-7" noValidate>
            <FormField label="Email address" htmlFor="recovery-email" error={shownError} required><Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} error={shownError} placeholder="you@example.com" /></FormField>
            <Button type="submit" loading={loading} disabled={retry.waiting} className="w-full mt-5">{retry.waiting ? `Try again in ${waitLabel(retry.seconds)}` : <><Send className="w-4 h-4" /> Send reset code</>}</Button>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 mt-6"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link>
          </form>
        </div>
      </div>
    </div>
  )
}
