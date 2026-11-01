import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PasswordField from './PasswordField.jsx'
import { isValidPersonName, isValidPhone, sanitizePersonName, sanitizePhone } from '../../utils/inputValidation.js'
import { passwordGuidance, passwordProblem } from '../../utils/password.js'

const FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Muhammad Hasnain Ali', autoComplete: 'name', maxLength: 80 },
  { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
  { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+92 300 1234567', autoComplete: 'tel', inputMode: 'tel', maxLength: 16 },
]

// The one sign-up form for the whole app. Pages wrap it with their own layout and decide where a new
// customer goes next. `register(name, email, phone, password)` resolves to { success, message, fieldErrors, status }.
export default function SignupForm({ register, onSuccess, submitLabel = 'Create Account', idPrefix = 'signup' }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const validate = () => {
    const found = {}
    if (!isValidPersonName(form.name)) found.name = 'Enter a valid full name using letters only.'
    if (!form.email.trim()) found.email = 'Email is required.'
    if (!isValidPhone(form.phone)) found.phone = 'Enter a valid phone number with 10 to 15 digits.'
    const problem = passwordProblem(form.password, form)
    if (problem) found.password = problem.message
    if (form.password !== form.confirm) found.confirm = 'Passwords do not match.'
    if (!form.terms) found.terms = 'Accept the Terms of Use and Privacy Notice to continue.'
    return found
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (loading) return
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return
    setLoading(true)
    const result = await register(form.name, form.email, form.phone, form.password)
    setLoading(false)
    if (result.success) return onSuccess?.(result)
    const next = { ...result.fieldErrors }
    if (result.status === 409) next.email = 'An account already exists for this email. Sign in instead, or reset your password.'
    if (!Object.keys(next).length) next.submit = result.message || 'Registration failed. Please try again.'
    setErrors(next)
  }

  const guidance = passwordGuidance(form.password, form)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {FIELDS.map(field => (
        <div key={field.key}>
          <label htmlFor={`${idPrefix}-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
          <input
            id={`${idPrefix}-${field.key}`} type={field.type} value={form[field.key]} placeholder={field.placeholder} required
            autoComplete={field.autoComplete} inputMode={field.inputMode} maxLength={field.maxLength}
            aria-invalid={errors[field.key] ? 'true' : undefined} aria-describedby={errors[field.key] ? `${idPrefix}-${field.key}-error` : undefined}
            onChange={event => update(field.key, field.key === 'name' ? sanitizePersonName(event.target.value) : field.key === 'phone' ? sanitizePhone(event.target.value) : event.target.value)}
            className={`input-light ${errors[field.key] ? 'border-red-400' : ''}`}
          />
          {errors[field.key] && <p id={`${idPrefix}-${field.key}-error`} role="alert" className="text-red-600 text-xs mt-1">{errors[field.key]}</p>}
        </div>
      ))}

      <PasswordField
        id={`${idPrefix}-password`} label="Password" value={form.password} onChange={value => update('password', value)}
        error={errors.password} hint={guidance.text} hintTone={guidance.tone} placeholder="Min. 8 characters" maxLength={128}
      />
      <PasswordField
        id={`${idPrefix}-confirm`} label="Confirm Password" value={form.confirm} onChange={value => update('confirm', value)}
        error={errors.confirm} placeholder="Repeat password" maxLength={128}
      />

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={form.terms} onChange={event => update('terms', event.target.checked)} required className="mt-0.5 accent-blue-600" />
        <span className="text-gray-500 text-sm">
          I agree to the <Link to="/terms" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Terms of Use</Link> and{' '}
          <Link to="/privacy" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Privacy Notice</Link>
        </span>
      </label>

      {errors.terms && <p role="alert" className="text-red-600 text-xs -mt-2">{errors.terms}</p>}
      {errors.submit && <p role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errors.submit}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" role="status" aria-label="Creating account" /> : <>{submitLabel} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  )
}
