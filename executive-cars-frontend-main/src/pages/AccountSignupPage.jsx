import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, UserPlus } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/authContext.js'
import { isValidPersonName, isValidPhone, sanitizePersonName, sanitizePhone } from '../utils/inputValidation.js'

export default function AccountSignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registerAccount } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: false })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!isValidPersonName(form.name)) return setError('Enter a valid full name using letters only.')
    if (!isValidPhone(form.phone)) return setError('Enter a valid phone number with 10 to 15 digits.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true); setError('')
    const result = await registerAccount(form.name, form.email, form.phone, form.password)
    if (result.success) navigate(searchParams.get('next') === 'auction' ? '/auction/payment' : '/account', { replace: true })
    else setError(result.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-elevated p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5"><Logo className="w-10 h-10" /><span className="font-black text-gray-900">Executive <span className="text-blue-600">Cars</span></span></Link>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mt-8"><UserPlus className="w-6 h-6 text-blue-600" /></div>
        <h1 className="text-3xl font-black text-gray-900 mt-4">Create your account</h1>
        <p className="text-sm text-gray-500 mt-2">One account lets you buy, sell, manage listings, and activate auction access.</p>
        <form onSubmit={submit} className="space-y-4 mt-7">
          <div className="grid sm:grid-cols-2 gap-4"><Field label="Full name" type="text" value={form.name} onChange={value => update('name', sanitizePersonName(value))} autoComplete="name" maxLength={80} /><Field label="Phone number" type="tel" value={form.phone} onChange={value => update('phone', sanitizePhone(value))} autoComplete="tel" inputMode="tel" maxLength={16} placeholder="+923001234567" /></div>
          <Field label="Email address" type="email" value={form.email} onChange={value => update('email', value)} autoComplete="email" />
          <div className="grid sm:grid-cols-2 gap-4"><PasswordField label="Password" value={form.password} onChange={value => update('password', value)} show={showPass} toggle={() => setShowPass(value => !value)} /><PasswordField label="Confirm password" value={form.confirm} onChange={value => update('confirm', value)} show={showPass} /></div>
          <label className="flex items-start gap-2.5 text-xs text-gray-500"><input type="checkbox" checked={form.terms} onChange={event => update('terms', event.target.checked)} required className="mt-0.5 accent-blue-600" /><span>I agree to the marketplace terms and safe-trading guidelines.</span></label>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="btn-primary w-full py-3.5 text-sm gap-2">{loading ? 'Creating account…' : <><UserPlus className="w-4 h-4" /> Create Account</>}</button>
        </form>
        <div className="mt-6 pt-5 border-t border-gray-200 text-center"><p className="text-sm text-gray-500">Already registered? <Link to="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link></p><p className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-3"><CheckCircle2 className="w-4 h-4 text-green-600" /> No buyer/seller role selection</p></div>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, autoComplete, ...inputProps }) {
  return <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1.5">{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} required autoComplete={autoComplete} className="input-light" {...inputProps} /></label>
}

function PasswordField({ label, value, onChange, show, toggle }) {
  return <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1.5">{label}</span><span className="relative block"><input type={show ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} required autoComplete="new-password" className="input-light pr-10" />{toggle && <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={show ? 'Hide passwords' : 'Show passwords'}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}</span></label>
}
