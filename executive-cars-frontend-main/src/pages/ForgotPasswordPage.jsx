import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import api from '../api/api.js'
import Button from '../components/ui/Button.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import { FormField, Input } from '../components/ui/FormControls.jsx'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setResponse(data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not process the request. Please try again.')
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
          <p className="text-sm text-gray-500 leading-6 mt-2">Enter the email on your customer account. For privacy, the response is the same whether an account exists or not.</p>
          {response ? (
            <div className="mt-6">
              <Alert tone="success" title="Check your email">{response.message}</Alert>
              {response.developmentResetUrl && <Alert tone="warning" title="Development delivery" className="mt-3">Email delivery is simulated locally. <Link className="font-bold underline" to={response.developmentResetUrl.replace(/^https?:\/\/[^/]+/, '')}>Open the local reset link.</Link></Alert>}
              <Button as={Link} to="/login" variant="outline" className="w-full mt-5"><ArrowLeft className="w-4 h-4" /> Back to sign in</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7">
              <FormField label="Email address" htmlFor="recovery-email" error={error} required><Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} error={error} placeholder="you@example.com" /></FormField>
              <Button type="submit" loading={loading} className="w-full mt-5"><Send className="w-4 h-4" /> Send reset instructions</Button>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 mt-6"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
