import React, { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, CircleAlert, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'

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
  const location = useLocation()
  const { updateUser } = useAuth()
  const membership = location.state?.membership
  const success = membership?.subscriptionStatus === 'active' && membership?.paymentMode === 'demo'

  useEffect(() => {
    if (!success) return
    updateUser({
      subscriptionStatus: membership.subscriptionStatus,
      subscriptionExpiry: membership.subscriptionExpiry,
      subscriptionPlan: membership.subscriptionPlan,
      membershipSource: 'demo',
      capabilities: { auction: true },
    })
  }, [membership, success, updateUser])

  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
    {success && <Confetti />}
    <div className="relative z-10 bg-white border border-gray-200 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
      {success ? <><CheckCircle className="w-20 h-20 text-blue-600 mx-auto" /><div className="flex justify-center gap-2 mt-4">{[0, 1, 2].map(index => <Sparkles key={index} className="w-4 h-4 text-blue-500 animate-pulse" />)}</div></> : <CircleAlert className="w-20 h-20 text-red-500 mx-auto" />}
      <h1 className="text-3xl font-black text-gray-900 mt-5">{success ? 'Demo Auction Access Activated' : 'Activation details unavailable'}</h1>
      <p className="text-gray-500 mt-3 mb-7">{success ? 'Your demonstration account can now use the annual auction features. No payment or financial transaction occurred.' : 'Return to the membership page to run the demonstration activation.'}</p>
      {success ? <><div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-900 mb-5"><p><span className="font-bold">Mode:</span> Demonstration only</p><p className="mt-1"><span className="font-bold">Financial status:</span> No charge, receipt, or settlement</p></div><div className="flex flex-col gap-3"><Link to="/auction/dashboard" className="btn-primary py-3.5 text-sm">View Auctions</Link><Link to="/" className="btn-ghost py-3.5 text-sm">Back to Home</Link></div></> : <div className="flex flex-col gap-3"><Link to="/auction/payment" className="btn-primary py-3.5 text-sm">Return to Demo Activation</Link><Link to="/account" className="btn-ghost py-3.5 text-sm">My Account</Link></div>}
    </div>
  </div>
}
