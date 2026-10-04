import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle, FlaskConical, Lock, Shield } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import api from '../../api/api.js'
import { useAuth } from '../../context/authContext.js'
import { hasActiveMembership } from '../../utils/membership.js'
import useMembershipCapabilities, { membershipPriceLabel } from '../../hooks/useMembershipCapabilities.js'
import MembershipAvailability from '../../components/MembershipAvailability.jsx'

const benefits = [
  'Place bids on live member auctions',
  'View member auction listings',
  'Access available inspection information',
]

export default function AuctionPaymentPage() {
  const { user, refreshUser } = useAuth()
  const capability = useMembershipCapabilities(!hasActiveMembership(user))
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (hasActiveMembership(user)) return <Navigate to="/auction/dashboard" replace />

  const activateDemoMembership = async () => {
    if (!capability.available || loading) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/payments/demo-complete')
      if (data?.subscriptionStatus !== 'active') throw new Error('Membership was not activated')
      navigate('/auction/payment-success', { replace: true, state: { membership: data } })
    } catch (requestError) {
      // A timeout can happen after commit. Check the saved account before retrying.
      try {
        const current = await refreshUser()
        if (hasActiveMembership(current)) {
          navigate('/auction/payment-success', { replace: true })
          return
        }
      } catch { /* Keep the original error; a failed status check grants no access. */ }
      if (requestError.response?.status === 404 || requestError.response?.data?.code === 'MEMBERSHIP_UNAVAILABLE') capability.retry()
      setError(requestError.response?.data?.message || requestError.message || 'Unable to activate the demo membership. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <Logo className="w-8 h-8" />
            <span className="text-gray-900 font-bold text-lg">Executive <span className="primary-text">Cars</span></span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-blue-600" /></div>
            <div className="w-16 h-1 bg-blue-600 rounded-full" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
          </div>
          <div className="flex justify-center gap-16 text-xs"><span className="text-blue-600 font-semibold">Account</span><span className="text-blue-600 font-semibold">Demo access</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-8">
          <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h1 className="text-gray-900 font-black text-2xl">Annual Auction Membership</h1>
            <p className="text-gray-500 text-sm mt-2">Annual access to member auction listings and live bidding.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6">
              <div className="flex items-center justify-between"><span className="text-gray-700 font-semibold">Plan</span><span className="text-gray-900 font-bold">Annual</span></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3"><span className="text-gray-700 font-semibold">Demonstration plan value</span><span className="text-blue-600 font-black text-2xl whitespace-nowrap">{membershipPriceLabel(capability.data)}</span></div>
              <div className="flex items-center justify-between mt-3 text-sm"><span className="text-gray-600">Duration</span><span className="font-semibold text-gray-800">{capability.data ? `${capability.data.durationYears} year` : '—'}</span></div>
              <div className="mt-4 border-t border-blue-200 pt-4 text-sm text-gray-600"><span className="font-semibold">Account:</span> {user?.name || 'Current member'}<br />{user?.email}</div>
              <ul className="space-y-2.5 mt-5">
                {benefits.map(benefit => <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-600 shrink-0" />{benefit}</li>)}
              </ul>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col justify-center">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center"><FlaskConical className="w-7 h-7 text-blue-600" /></div>
            <h2 className="text-xl font-black text-gray-900 mt-4">{capability.available ? 'Simulate Membership Activation' : 'Membership Activation'}</h2>
            <MembershipAvailability capability={capability} />
            {capability.available && <><span className="inline-flex w-fit rounded-full bg-amber-50 border border-amber-200 px-3 py-1 mt-3 text-xs font-black uppercase tracking-wide text-amber-800">Demonstration Mode</span>
            <p className="text-sm text-gray-500 leading-6 mt-2">This action demonstrates gated auction access. It does not collect card details, charge money, contact a payment provider, or issue a financial receipt.</p></>}
            {error && <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mt-5">{error}</div>}
            {capability.available && <button type="button" onClick={activateDemoMembership} disabled={loading} className="btn-primary w-full py-4 text-sm gap-2 mt-6 disabled:opacity-60">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Activating demo access…' : 'Activate Demo Membership'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>}
            <Link to="/account" className="mt-4 text-center text-sm font-bold text-blue-700 hover:underline">My Account</Link>
            <Link to="/auction" className="mt-4 text-center text-sm font-bold text-blue-700 hover:underline">Back to Auctions</Link>
            <div className="mt-5 text-xs text-gray-500"><span className="flex items-center justify-center gap-1.5"><Shield className="w-4 h-4 text-blue-600" /> No financial transaction occurs.</span></div>
          </section>
        </div>
      </div>
    </div>
  )
}
