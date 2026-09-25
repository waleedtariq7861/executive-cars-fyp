import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, Lock, Car, Users, BarChart3, CheckCircle } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useAuth } from '../../context/authContext.js'
import api from '../../api/api.js'

const demoAccountsEnabled = (import.meta.env.DEV || import.meta.env.VITE_APP_MODE === 'demo') && import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { loginAdmin } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoAccount, setDemoAccount] = useState(null)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!demoAccountsEnabled) return
    api.get('/demo/accounts').then(response => setDemoAccount(response.data?.admin || null)).catch(() => setDemoAccount(null))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    const result = await loginAdmin(form.email, form.password)
    if (result.success && result.role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      setError(result.message || 'Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

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
          <p className="text-slate-400 text-base mb-10">Full control over listings, members, bookings, and auctions.</p>

          <div className="space-y-4">
            {[
              { icon: Users, text: 'Manage auction members & subscriptions' },
              { icon: BarChart3, text: 'View real-time auction bids & stats' },
              { icon: CheckCircle, text: 'Approve/reject seller inspection bookings' },
              { icon: Car, text: 'Upload & manage car listings' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Admin Login</h2>
            <p className="text-gray-500 text-sm mt-1">Authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input id="admin-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="username"
                className={`input-light ${error ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="admin-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required autoComplete="current-password"
                  className={`input-light pr-10 ${error ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-200">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Lock className="w-4 h-4" /> Sign In to Admin Portal</>
              }
            </button>
          </form>

          {demoAccountsEnabled && demoAccount && (
            <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-label="Demo Accounts">
              <h3 className="text-sm font-black text-blue-950">Demo Administrator</h3>
              <p className="mt-1 text-xs leading-5 text-blue-800">Local FYP demonstration only. This fills the form; Sign In remains required.</p>
              <button type="button" onClick={() => { setForm({ email: demoAccount.email, password: demoAccount.password }); setError('') }} className="mt-3 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-800 hover:bg-blue-100">Use admin demo account</button>
            </section>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">Are you a seller?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">Seller Login →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
