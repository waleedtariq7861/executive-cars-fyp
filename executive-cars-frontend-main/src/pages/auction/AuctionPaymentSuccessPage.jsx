import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { CheckCircle, CircleAlert, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import api from '../../api/api.js'
import { AUCTION_MEMBERSHIP_PRICE_LABEL } from '../../config/auctionMembership.js'

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 50 }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
    backgroundColor: ['#2563eb', '#60a5fa', '#ffffff', '#1d4ed8', '#93c5fd'][Math.floor(Math.random() * 5)],
    width: `${4 + Math.random() * 8}px`,
    height: `${4 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  })), [])

  return <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">{pieces.map(({ id, ...piece }) => <div key={id} className="absolute top-0" style={{ ...piece, animation: `confetti ${piece.animationDuration} ${piece.animationDelay} ease-in forwards` }} />)}</div>
}

export default function AuctionPaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const sessionId = searchParams.get('session_id')
  const { updateUser } = useAuth()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Confirming your payment with Stripe…')

  useEffect(() => {
    let active = true
    const demoMembership = location.state?.membership
    if (demoMembership?.subscriptionStatus === 'active') {
      updateUser({ subscriptionStatus: demoMembership.subscriptionStatus, subscriptionExpiry: demoMembership.subscriptionExpiry, subscriptionPlan: demoMembership.subscriptionPlan, membershipSource: 'demo', capabilities: { auction: true } })
      setStatus('success')
      setMessage('Test payment completed successfully. Your annual auction membership is active.')
      return () => { active = false }
    }
    if (!sessionId) {
      setStatus('error')
      setMessage('The payment session is missing. Please return to the membership page.')
      return () => { active = false }
    }

    api.get('/payments/verify-session', { params: { session_id: sessionId } })
      .then(({ data }) => {
        if (!active) return
        if (data.subscriptionStatus !== 'active') throw new Error('Membership was not activated')
        updateUser({
          subscriptionStatus: data.subscriptionStatus,
          subscriptionExpiry: data.subscriptionExpiry,
          capabilities: { auction: true },
        })
        setStatus('success')
        setMessage('Your membership is active. You can now join live auctions.')
      })
      .catch(error => {
        if (!active) return
        setStatus('error')
        setMessage(error.response?.data?.message || error.message || 'Payment could not be verified. Please try again.')
      })

    return () => { active = false }
  }, [sessionId, updateUser, location.state])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {status === 'success' && <Confetti />}
      <div className="relative z-10 bg-white border border-gray-200 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
        {status === 'verifying' && <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />}
        {status === 'success' && <><CheckCircle className="w-20 h-20 text-blue-600 mx-auto" /><div className="flex justify-center gap-2 mt-4">{[0, 1, 2].map(index => <Sparkles key={index} className="w-4 h-4 text-blue-500 animate-pulse" />)}</div></>}
        {status === 'error' && <CircleAlert className="w-20 h-20 text-red-500 mx-auto" />}

        <h1 className="text-3xl font-black text-gray-900 mt-5">
          {status === 'verifying' ? 'Verifying payment' : status === 'success' ? 'Auction Access Activated' : 'Verification failed'}
        </h1>
        <p className="text-gray-500 mt-3 mb-7">{message}</p>

        {status === 'success' ? (
          <><div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-left text-sm text-gray-700 mb-5"><p><span className="font-bold">Plan:</span> Annual Auction Membership</p><p className="mt-1"><span className="font-bold">Amount:</span> {AUCTION_MEMBERSHIP_PRICE_LABEL}</p><p className="mt-1"><span className="font-bold">Payment Mode:</span> Test</p></div><div className="flex flex-col gap-3"><Link to="/auction/dashboard" className="btn-primary py-3.5 text-sm">View Auctions</Link><Link to="/" className="btn-ghost py-3.5 text-sm">Back to Home</Link></div></>
        ) : status === 'error' ? (
          <div className="flex flex-col gap-3"><Link to="/auction/payment" className="btn-primary py-3.5 text-sm">Return to Membership</Link><Link to="/account" className="btn-ghost py-3.5 text-sm">My Account</Link></div>
        ) : null}
      </div>
    </div>
  )
}
