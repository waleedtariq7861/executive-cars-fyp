import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import api from '../api/api.js'
import Button from '../components/ui/Button.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import { FormField, Input } from '../components/ui/FormControls.jsx'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (!token) return setError('This reset link is incomplete.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setComplete(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

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
              <FormField label="New password" htmlFor="new-password" error={error} required><div className="relative"><Input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} error={error} className="pr-11" /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></FormField>
              <FormField label="Confirm new password" htmlFor="confirm-password" required><Input id="confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={event => setForm(current => ({ ...current, confirm: event.target.value }))} /></FormField>
              <Button type="submit" loading={loading} className="w-full">Reset password</Button>
              <Link to="/forgot-password" className="block text-center text-sm font-bold text-blue-700">Request a new link</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
