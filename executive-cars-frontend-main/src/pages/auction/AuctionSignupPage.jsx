import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, Crown, ArrowRight } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useAuth } from '../../context/authContext.js'
import { hasActiveMembership } from '../../utils/membership.js'
import { isValidPersonName, isValidPhone, sanitizePersonName, sanitizePhone } from '../../utils/inputValidation.js'

const perks = [
  'Access to all live car auctions',
  'Real-time bidding with instant updates',
  'Full inspection reports for every car',
  'Exclusive members-only listings',
  'Priority customer support',
  'Bid history and won cars tracking',
]

export default function AuctionSignupPage() {
  const navigate = useNavigate()
  const { user, registerMember } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: false })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!isValidPersonName(form.name)) e.name = 'Enter a valid full name using letters only.'
    if (!form.email?.trim()) e.email = 'Email is required.'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.'
    if (!isValidPhone(form.phone)) e.phone = 'Enter a valid phone number with 10 to 15 digits.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    const result = await registerMember(form.name, form.email, form.phone, form.password)
    setLoading(false)
    if (result.success) {
      navigate('/auction/payment')
    } else {
      setErrors({ email: result.message || 'Registration failed. Try a different email.' })
    }
  }

  if (user?.role === 'user') {
    const active = hasActiveMembership(user)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-elevated p-8 max-w-md w-full text-center">
          <Logo className="w-11 h-11 mx-auto" />
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mt-7"><Crown className="w-7 h-7 text-blue-600" /></div>
          <h1 className="text-2xl font-black text-gray-900 mt-5">Your account is ready</h1>
          <p className="text-sm text-gray-500 leading-6 mt-2">You do not need another auction account. {active ? 'Your auction membership is already active.' : 'Activate auction access on this same account.'}</p>
          <Link to={active ? '/auction/dashboard' : '/auction/payment'} className="btn-primary w-full py-3.5 text-sm gap-2 mt-7">{active ? 'Open Auction Dashboard' : 'Continue to Membership Payment'} <ArrowRight className="w-4 h-4" /></Link>
          <Link to="/account" className="inline-block text-sm text-blue-600 hover:underline mt-5">Back to my account</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0f172a] relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center h-full px-12">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <Logo className="w-9 h-9" />
            <span className="text-white font-black text-lg">Executive <span className="animated-gradient-text">Cars</span></span>
          </Link>

          <Crown className="w-12 h-12 text-blue-400 mb-5" />
          <h2 className="text-4xl font-black text-white mb-3">
            Join Executive<br /><span className="animated-gradient-text">Auctions</span>
          </h2>
          <p className="text-slate-400 mb-8">Pakistan's most transparent car auction platform.</p>

          <ul className="space-y-3">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-300 text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <div className="flex-1 h-1 bg-gray-200 rounded-full" />
              <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 font-bold text-sm">2</div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-600 font-semibold">Account Details</span>
              <span className="text-gray-400">Payment</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">Create Your Unified Account</h2>
          <p className="text-sm text-gray-500 mb-6">This account also works for buying and selling cars.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Muhammad Hasnain Ali' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+92 300 1234567' },
            ].map(f => (
              <div key={f.key}>
                <label htmlFor={`auction-signup-${f.key}`} className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input id={`auction-signup-${f.key}`} type={f.type} value={form[f.key]} onChange={e => update(f.key, f.key === 'name' ? sanitizePersonName(e.target.value) : f.key === 'phone' ? sanitizePhone(e.target.value) : e.target.value)}
                  placeholder={f.placeholder} required inputMode={f.key === 'phone' ? 'tel' : undefined} maxLength={f.key === 'name' ? 80 : f.key === 'phone' ? 16 : undefined} className={`input-light ${errors[f.key] ? 'border-red-400' : ''}`} />
                {errors[f.key] && <p className="text-red-600 text-xs mt-1">{errors[f.key]}</p>}
              </div>
            ))}

            <div>
              <label htmlFor="auction-signup-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="auction-signup-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                  placeholder="Min. 8 characters" required className={`input-light pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="auction-signup-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input id="auction-signup-confirm" type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={e => update('confirm', e.target.value)}
                  placeholder="Repeat password" required className={`input-light pr-10 ${errors.confirm ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-red-600 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.terms} onChange={e => update('terms', e.target.checked)} required className="mt-0.5 accent-blue-600" />
              <span className="text-gray-500 text-sm">
                I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-200">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Proceed to Payment <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an Executive Cars account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
