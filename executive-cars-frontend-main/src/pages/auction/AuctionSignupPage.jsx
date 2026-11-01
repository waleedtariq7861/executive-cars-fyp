import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Crown, ArrowRight } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useAuth } from '../../context/authContext.js'
import { hasActiveMembership } from '../../utils/membership.js'
import useMembershipCapabilities from '../../hooks/useMembershipCapabilities.js'
import MembershipAvailability from '../../components/MembershipAvailability.jsx'
import SignupForm from '../../components/auth/SignupForm.jsx'

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
  const capability = useMembershipCapabilities(!hasActiveMembership(user))
  const goNext = () => navigate(capability.available ? '/auction/payment' : '/account')

  if (user?.role === 'user') {
    const active = hasActiveMembership(user)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-elevated p-8 max-w-md w-full text-center">
          <Logo className="w-11 h-11 mx-auto" />
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mt-7"><Crown className="w-7 h-7 text-blue-600" /></div>
          <h1 className="text-2xl font-black text-gray-900 mt-5">Your account is ready</h1>
          <p className="text-sm text-gray-500 leading-6 mt-2">You do not need another auction account. {active ? 'Your auction membership is already active.' : 'Auction membership uses this same account.'}</p>
          {!active && <MembershipAvailability capability={capability} />}
          <Link to={active ? '/auction/dashboard' : '/auction/payment'} className="btn-primary w-full py-3.5 text-sm gap-2 mt-7">{active ? 'Open Auction Dashboard' : capability.available ? 'Continue to Demo Activation' : 'Membership Details'} <ArrowRight className="w-4 h-4" /></Link>
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
              <span className="text-gray-400">Membership</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">Create Your Unified Account</h2>
          <p className="text-sm text-gray-500 mb-6">This account also works for buying and selling cars.</p>
          <MembershipAvailability capability={capability} />

          <SignupForm register={registerMember} onSuccess={goNext} submitLabel={capability.available ? 'Create Account and Continue to Demo' : 'Create Account'} idPrefix="auction-signup" />

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an Executive Cars account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
