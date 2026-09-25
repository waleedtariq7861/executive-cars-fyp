import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Car, ClipboardCheck, Gavel, TrendingUp,
  CheckCircle, Clock, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import { formatPKR } from '../../utils/format.js'
import SellerLayout from '../../components/SellerLayout.jsx'
import api from '../../api/api.js'
import { formatBidCount } from '../../utils/auction.js'

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/seller/bookings'), api.get('/seller/listings')])
      .then(([bookingRes, listingRes]) => {
        setBookings(bookingRes.data)
        setListings([...listingRes.data.auctionCars, ...listingRes.data.usedCars])
      })
      .catch(err => setLoadError(err.response?.data?.message || 'Could not load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const activeAuction = listings
    .filter(listing => listing.auctionEnd && listing.status === 'active')
    .sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0))[0]

  return (
    <SellerLayout title="Dashboard">
      {loadError && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{loadError}</div>}

      {/* Live listing summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">
              {activeAuction ? 'Your Auction is Live! 🚗' : `Welcome back, ${user?.name || 'Seller'}`}
            </h2>
            <p className="text-blue-100 text-sm">
              {activeAuction
                ? `${activeAuction.make} ${activeAuction.model} ${activeAuction.year} has ${formatBidCount(activeAuction.bidCount)}. Current bid: PKR ${formatPKR(activeAuction.currentBid || activeAuction.basePrice)}`
                : 'Book an inspection to get your car approved and listed.'}
            </p>
          </div>
          <Link to={activeAuction ? `/auction/car/${activeAuction._id}` : '/seller/book-inspection'} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shrink-0">
            {activeAuction ? 'View Auction' : 'Book Inspection'}
          </Link>
        </div>
      </div>

      {loading ? <SellerDashboardSkeleton /> : loadError ? (
        <div className="bg-white border border-red-200 rounded-2xl p-10 text-center text-sm text-red-700">Dashboard figures and recent activity are unavailable.</div>
      ) : <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-busy="false">
        {[
          { label: 'My Bookings',        value: bookings.length,  icon: ClipboardCheck, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
          { label: 'Active Listings',    value: listings.length,  icon: Car,            color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
          { label: 'Total Bids Received', value: listings.reduce((a, l) => a + (l.bidCount || 0), 0), icon: Gavel, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'Estimated Value',    value: listings.length ? `PKR ${formatPKR(Math.max(...listings.map(l => l.currentBid || l.basePrice || l.price || 0)))}` : '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-5 shadow-sm`}>
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`text-2xl font-black ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-gray-600 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* My Inspection Bookings */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
              <h3 className="text-gray-900 font-bold">My Inspection Bookings</h3>
            </div>
            <Link to="/seller/book-inspection" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              + New <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No bookings yet</p>
            ) : bookings.slice(0, 3).map(b => (
              <div key={b._id} className="px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{b.carMake} {b.carModel} {b.carYear}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{b.branch} · {b.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    b.status === 'approved' ? 'badge-green' :
                    b.status === 'rejected' ? 'badge-red' : 'badge-yellow'
                  }`}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {b.status === 'approved' && (
                    <div className="flex items-center gap-1.5 text-green-600 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Inspection confirmed — bring your car on {b.date}
                    </div>
                  )}
                  {b.status === 'pending' && (
                    <div className="flex items-center gap-1.5 text-yellow-600 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting admin review
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link to="/seller/book-inspection" className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold text-center block">
              Book New Inspection
            </Link>
          </div>
        </div>

        {/* My Listings */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-green-500" />
              <h3 className="text-gray-900 font-bold">My Car Listings</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {listings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No listings yet</p>
            ) : listings.slice(0, 3).map(l => (
              <div key={l._id} className="flex items-center gap-4 px-5 py-4">
                {l.images?.[0] && <img src={l.images[0]} alt={`${l.make} ${l.model}`} className="w-16 h-12 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm">{l.make} {l.model} {l.year}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.auctionEnd ? 'badge-blue' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {l.auctionEnd ? 'Auction' : 'Used Car'}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.status === 'active' ? 'badge-green' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-blue-600 font-bold text-sm">PKR {formatPKR(l.currentBid || l.basePrice || l.price)}</p>
                  {l.bidCount > 0 && <p className="text-gray-400 text-xs">{formatBidCount(l.bidCount)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {[
          { icon: ClipboardCheck, label: 'Book Inspection', to: '/seller/book-inspection', color: 'bg-blue-50 text-blue-600 border-blue-200' },
          { icon: TrendingUp, label: 'Price Predictor', to: '/price-predictor', color: 'bg-green-50 text-green-600 border-green-200' },
          { icon: Gavel, label: 'View Auctions', to: '/auction', color: 'bg-purple-50 text-purple-600 border-purple-200' },
          { icon: Car, label: 'Browse Used Cars', to: '/used-cars', color: 'bg-orange-50 text-orange-600 border-orange-200' },
        ].map(a => (
          <Link key={a.label} to={a.to}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border ${a.color} hover:shadow-md transition-all text-center`}>
            <a.icon className="w-6 h-6" />
            <span className="text-sm font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>
    </SellerLayout>
  )
}

function SellerDashboardSkeleton() {
  return <div role="status" aria-label="Loading seller dashboard" aria-busy="true" className="animate-pulse">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[1, 2, 3, 4].map(item => <div key={item} className="h-32 rounded-2xl bg-gray-100 border border-gray-200" />)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">{[1, 2].map(item => <div key={item} className="h-64 rounded-2xl bg-gray-100 border border-gray-200" />)}</div>
  </div>
}
