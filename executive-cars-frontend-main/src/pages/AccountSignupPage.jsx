import React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, UserPlus } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import SignupForm from '../components/auth/SignupForm.jsx'
import { useAuth } from '../context/authContext.js'

export default function AccountSignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registerAccount } = useAuth()
  const goNext = () => navigate(searchParams.get('next') === 'auction' ? '/auction/payment' : '/account', { replace: true })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-elevated p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5"><Logo className="w-10 h-10" /><span className="font-black text-gray-900">Executive <span className="text-blue-600">Cars</span></span></Link>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mt-8"><UserPlus className="w-6 h-6 text-blue-600" /></div>
        <h1 className="text-3xl font-black text-gray-900 mt-4">Create your account</h1>
        <p className="text-sm text-gray-500 mt-2">One account lets you buy, sell, manage listings, and activate auction access.</p>
        <div className="mt-7"><SignupForm register={registerAccount} onSuccess={goNext} submitLabel="Create Account" idPrefix="account-signup" /></div>
        <div className="mt-6 pt-5 border-t border-gray-200 text-center"><p className="text-sm text-gray-500">Already registered? <Link to="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link></p><p className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-3"><CheckCircle2 className="w-4 h-4 text-green-600" /> No buyer/seller role selection</p></div>
      </div>
    </div>
  )
}
