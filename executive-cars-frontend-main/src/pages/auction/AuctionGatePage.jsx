import React from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Crown, CheckCircle, Gavel, Shield, Star } from 'lucide-react'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/authContext.js'
import { hasActiveMembership } from '../../utils/membership.js'
import { AUCTION_MEMBERSHIP_PRICE_LABEL } from '../../config/auctionMembership.js'


export default function AuctionGatePage() {
  const { user } = useAuth()
  const active = user?.role === 'user' && hasActiveMembership(user)
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0f172a] pt-28 md:pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
            <Gavel className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Live Auctions — Members Only</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
            Exclusive Car Auctions<br />
            <span className="animated-gradient-text">Members Only</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Bid on professionally inspected vehicles in real-time. Transparent, competitive, and fully digital.
          </p>
        </div>
      </section>

      {/* Cards + Test Accounts */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Already a Member */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 card-hover shadow-sm group">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                <LogIn className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-gray-900 font-bold text-xl mb-2 text-center">Use Your Account</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">
                One Executive Cars login works for buying, selling, and auction membership.
              </p>
              <Link to={user?.role === 'user' ? '/account' : '/login'}
                className="btn-brand w-full py-3 rounded-xl font-semibold text-sm block text-center">
                {user?.role === 'user' ? 'Open My Account' : 'Sign In'}
              </Link>
            </div>

            {/* Become a Member */}
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 card-hover shadow-sm group relative overflow-hidden">
              <div className="absolute top-3 right-3 badge-blue text-xs px-2 py-0.5 rounded-full font-semibold">New</div>
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-gray-900 font-bold text-xl mb-2 text-center">Activate Auction Access</h3>
              <ul className="space-y-2 mb-6">
                {['Real-Time Bidding', 'Inspection Reports', 'Exclusive Listings', 'Priority Access'].map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />{perk}
                  </li>
                ))}
              </ul>
              <Link to={active ? '/auction/dashboard' : user?.role === 'user' ? '/auction/payment' : '/login'} state={!user ? { from: '/auction/payment', message: 'Please sign in to activate auction access.' } : undefined}
                className="btn-primary w-full py-3 rounded-xl font-semibold text-sm block text-center shadow-md shadow-blue-200">
                {active ? 'Open Auction Dashboard' : `Activate — ${AUCTION_MEMBERSHIP_PRICE_LABEL}/yr`}
              </Link>
            </div>
          </div>


          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Shield, label: 'Secure Payments' },
              { icon: CheckCircle, label: 'Verified Cars' },
              { icon: Star, label: 'Trusted Platform' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-500 text-sm">
                <Icon className="w-4 h-4 text-blue-600" />{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
