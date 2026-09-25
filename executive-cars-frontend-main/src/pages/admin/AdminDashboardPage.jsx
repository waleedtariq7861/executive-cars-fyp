import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, Gavel, Car, ArrowUpRight, Plus, Database, BadgeCheck, HandCoins
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import { formatBidCount } from '../../utils/auction.js'

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load dashboard statistics.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data ? [
    { label: 'Total Members',    value: data.totalMembers,    icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
    { label: 'Total Bookings',   value: data.totalBookings,   icon: Calendar,   color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { label: 'Active Auctions',  value: data.liveAuctions,   icon: Gavel,      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Used Cars Listed', value: data.usedCarsListed, icon: Car,        color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
    { label: 'Verified Cars', value: data.verifiedCars, icon: BadgeCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Pending Inspections', value: data.pendingInspections, icon: Calendar, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Dataset Rows', value: data.importedDatasetRows, icon: Database, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { label: 'Auction Bids', value: data.totalBids, icon: HandCoins, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  ] : []

  const recentBookings = data?.recentBookings || []
  const liveAuctionList = data?.liveAuctionList || []

  return (
    <AdminLayout title="Dashboard">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Welcome back, Admin</h2>
            <p className="text-blue-100 text-sm">Here's what's happening on Executive Cars today.</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/admin/upload-auction" className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Auction
            </Link>
            <Link to="/admin/upload-used-car" className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-400 transition-colors flex items-center gap-2 border border-blue-400">
              <Car className="w-4 h-4" /> Add Used Car
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 w-16 bg-gray-100 rounded mb-1" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
              <div className={`text-2xl font-black ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-gray-700 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Bookings */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <h3 className="text-gray-900 font-bold">Recent Bookings</h3>
            </div>
            <Link to="/admin/bookings" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div role="status" aria-label="Loading recent bookings" className="space-y-3 px-5 py-5 animate-pulse">{[1, 2, 3].map(item => <div key={item} className="h-10 rounded-lg bg-gray-100" />)}</div>
            ) : !data ? (
              <p className="text-red-600 text-sm text-center py-8">Bookings are unavailable.</p>
            ) : recentBookings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No bookings yet</p>
            ) : recentBookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-gray-900 font-medium text-sm">{b.name}</p>
                  <p className="text-gray-500 text-xs">{b.carMake} {b.carModel} · {b.branch} · {b.date}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  b.status === 'approved' ? 'badge-green' :
                  b.status === 'rejected' ? 'badge-red' : 'badge-yellow'
                }`}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link to="/admin/bookings" className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold text-center block">
              Manage All Bookings
            </Link>
          </div>
        </div>

        {/* Live Auctions */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-purple-500" />
              <h3 className="text-gray-900 font-bold">Live Auctions</h3>
              <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
              </span>
            </div>
            <Link to="/admin/auction-list" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div role="status" aria-label="Loading live auctions" className="space-y-3 px-5 py-5 animate-pulse">{[1, 2, 3].map(item => <div key={item} className="h-10 rounded-lg bg-gray-100" />)}</div>
            ) : !data ? (
              <p className="text-red-600 text-sm text-center py-8">Auctions are unavailable.</p>
            ) : liveAuctionList.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No active auctions</p>
            ) : liveAuctionList.map((a) => (
              <div key={a._id} className="flex items-center gap-3 px-5 py-3.5">
                {a.images?.[0] && <img src={a.images[0]} alt={a.make} className="w-14 h-10 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium text-sm">{a.make} {a.model} {a.year}</p>
                  <p className="text-gray-500 text-xs">{formatBidCount(a.bidCount)}</p>
                  {a.highestBidder && <p className="text-purple-600 text-xs font-medium mt-0.5">Top: {a.highestBidder.name}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-blue-600 font-bold text-sm">PKR {formatPKR(a.currentBid)}</p>
                  <p className="text-gray-400 text-xs">current bid</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link to="/admin/auction-list" className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold text-center block">
              Manage All Auctions
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
