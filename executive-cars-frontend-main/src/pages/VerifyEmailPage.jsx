import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, MailCheck } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import api from '../api/api.js'
import Button from '../components/ui/Button.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import { FormField, Input } from '../components/ui/FormControls.jsx'
import { useAuth } from '../context/authContext.js'
import useRetryCountdown from '../hooks/useRetryCountdown.js'
import { readApiError, waitLabel } from '../utils/apiError.js'

const RESEND_WAIT_SECONDS = 60
const safePath = value => (typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : '/account')

// Confirms the customer's email address with the 6-digit code mailed to it. Reached right after sign-up (the
// sign-up response says whether the code went out) and from the banner or a blocked action later on.
export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const next = safePath(location.state?.next)
  const initial = location.state?.verification
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [notice, setNotice] = useState(() => (initial && initial.sent === false
    ? { tone: 'error', text: initial.rateLimited ? 'A code was already sent a moment ago. Check your email, or wait to send a new one.' : 'We could not send the code. Send it again below.' }
    : null))
  const [devCode, setDevCode] = useState(initial?.devCode || '')
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const resend = useRetryCountdown()
  const codeSent = Boolean(initial?.sent) || Boolean(devCode)

  // A code that was just mailed at sign-up means the first resend must wait out the same minute.
  useEffect(() => { if (initial?.sent) resend.start(RESEND_WAIT_SECONDS) }, [])

  const sendCode = async () => {
    if (sending || resend.waiting) return
    setSending(true); setNotice(null); setCodeError('')
    try {
      const { data } = await api.post('/auth/email/send-code')
      if (data.verified) {
        await refreshUser()
        return
      }
      setDevCode(data.devCode || '')
      setNotice({ tone: 'success', text: `We sent a new code to ${user?.email}.` })
      resend.start(RESEND_WAIT_SECONDS)
    } catch (error) {
      const failure = readApiError(error, 'We could not send the code. Please try again in a moment.')
      setNotice({ tone: 'error', text: failure.message })
      if (failure.retryAfterSeconds) resend.start(failure.retryAfterSeconds)
    } finally {
      setSending(false)
    }
  }

  const submit = async event => {
    event.preventDefault()
    if (verifying) return
    const digits = code.replace(/\s+/g, '')
    if (!/^\d{6}$/.test(digits)) return setCodeError('Enter the 6-digit code.')
    setVerifying(true); setCodeError(''); setNotice(null)
    try {
      await api.post('/auth/email/verify', { code: digits })
      await refreshUser()
      navigate(next, { replace: true })
    } catch (error) {
      const failure = readApiError(error, 'Could not verify the code. Please try again.')
      setCodeError(failure.fieldErrors.code || failure.message)
      if (failure.code === 'TOO_MANY_ATTEMPTS' || failure.code === 'CODE_EXPIRED' || failure.code === 'NO_CODE') setCode('')
    } finally {
      setVerifying(false)
    }
  }

  const verified = user?.emailVerified === true

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-elevated p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5"><Logo className="w-10 h-10" /><span className="font-black text-gray-900">Executive <span className="text-blue-600">Cars</span></span></Link>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mt-8">{verified ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <MailCheck className="w-6 h-6 text-blue-600" />}</div>
        {verified ? (
          <>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Email verified</h1>
            <p className="text-sm text-gray-500 mt-2">{user.email} is confirmed.</p>
            <Button as={Link} to={next} className="w-full mt-6">Continue</Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-gray-900 mt-4">Verify your email</h1>
            <p className="text-sm text-gray-500 mt-2">
              {codeSent ? <>We sent a 6-digit code to <strong className="text-gray-800 break-all">{user?.email}</strong>. It is valid for 10 minutes.</>
                : <>Send a 6-digit code to <strong className="text-gray-800 break-all">{user?.email}</strong> to confirm it is yours.</>}
            </p>
            {notice && <Alert tone={notice.tone} className="mt-4">{notice.text}</Alert>}
            {devCode && <Alert tone="warning" title="Local delivery" className="mt-3">Your code is <strong className="tracking-widest">{devCode}</strong></Alert>}

            <form onSubmit={submit} className="mt-6" noValidate>
              <FormField label="Verification code" htmlFor="verification-code" error={codeError} required>
                <Input
                  id="verification-code" value={code} error={codeError} inputMode="numeric" autoComplete="one-time-code"
                  maxLength={7} placeholder="123456" className="tracking-[0.4em] text-center text-lg font-bold"
                  onChange={event => setCode(event.target.value.replace(/[^\d\s]/g, ''))}
                />
              </FormField>
              <Button type="submit" loading={verifying} className="w-full mt-5">Verify email</Button>
            </form>

            <Button type="button" variant="outline" loading={sending} disabled={resend.waiting} onClick={sendCode} className="w-full mt-3">
              {resend.waiting ? `Send a new code in ${waitLabel(resend.seconds)}` : codeSent ? 'Send a new code' : 'Send code'}
            </Button>
            <Link to={next} replace className="block text-center text-sm font-bold text-blue-700 mt-5">Verify later</Link>
          </>
        )}
      </div>
    </div>
  )
}
