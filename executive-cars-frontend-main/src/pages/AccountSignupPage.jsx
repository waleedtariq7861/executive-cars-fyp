import React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Crown, UserPlus } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import MembershipAvailability from '../components/MembershipAvailability.jsx'
import SignupForm from '../components/auth/SignupForm.jsx'
import { useAuth } from '../context/authContext.js'
import useMembershipCapabilities from '../hooks/useMembershipCapabilities.js'
import { hasActiveMembership } from '../utils/membership.js'

// The only sign-up page. One account covers buying, selling and auction membership, so there is no
// separate "auction sign-up" route. ?next=auction only changes where a new customer lands afterwards
// (the membership step, when activation is available).
export default function AccountSignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, registerAccount } = useAuth()
  const wantsAuction = searchParams.get('next') === 'auction'
  const capability = useMembershipCapabilities(wantsAuction && !hasActiveMembership(user))
  const goNext = () => navigate(wantsAuction && capability.available ? '/auction/payment' : '/account', { replace: true })

  if (user?.role === 'user') {
    const active = hasActiveMembership(user)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-elevated p-8 max-w-md w-full text-center">
          <Logo className="w-11 h-11 mx-auto" />
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mt-7"><Crown className="w-7 h-7 text-blue-600" /></div>
          <h1 className="text-2xl font-black text-gray-900 mt-5">Your account is ready</h1>
          <p className="text-sm text-gray-500 leading-6 mt-2">You are already signed in, so you do not need to sign up again. {active ? 'Your auction membership is already active.' : 'Auction membership uses this same account.'}</p>
          {wantsAuction && !active && <MembershipAvailability capability={capability} />}
          <Link to={active ? '/auction/dashboard' : '/auction/payment'} className="btn-primary w-full py-3.5 text-sm gap-2 mt-7">{active ? 'Open Auction Dashboard' : 'Auction Membership'} <ArrowRight className="w-4 h-4" /></Link>
          <Link to="/account" className="inline-block text-sm text-blue-600 hover:underline mt-5">Back to my account</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-elevated p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5"><Logo className="w-10 h-10" /><span className="font-black text-gray-900">Executive <span className="text-blue-600">Cars</span></span></Link>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mt-8"><UserPlus className="w-6 h-6 text-blue-600" /></div>
        <h1 className="text-3xl font-black text-gray-900 mt-4">Create your account</h1>
        <p className="text-sm text-gray-500 mt-2">One account lets you buy, sell, manage listings, and activate auction access.</p>
        {wantsAuction && <MembershipAvailability capability={capability} />}
        <div className="mt-7"><SignupForm register={registerAccount} onSuccess={goNext} submitLabel={wantsAuction && capability.available ? 'Create Account and Continue to Demo' : 'Create Account'} idPrefix="account-signup" /></div>
        <div className="mt-6 pt-5 border-t border-gray-200 text-center"><p className="text-sm text-gray-500">Already registered? <Link to="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link></p><p className="inline-flex items-center gap-1.5 text-xs text-gray-400 mt-3"><CheckCircle2 className="w-4 h-4 text-green-600" /> No buyer/seller role selection</p></div>
      </div>
    </div>
  )
}
