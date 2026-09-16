import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react'
import AuctionLayout from '../../components/AuctionLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import { useAuth } from '../../context/authContext.js'
import VehicleImage from '../../components/VehicleImage.jsx'

const statusConfig = {
  Leading: { color: 'badge-green', icon: TrendingUp,   text: 'You are leading' },
  Outbid:  { color: 'badge-red',   icon: TrendingDown, text: 'You were outbid' },
  Won:     { color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: CheckCircle, text: 'You won!' },
}

export default function AuctionMyBidsPage() {
  const { user } = useAuth()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/member/bids')
      .then(res => setBids(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load your bids.'))
      .finally(() => setLoading(false))
  }, [])

  // The API returns every bid event. Show one card per auction while keeping
  // the total bid count accurate and avoiding duplicate React keys/cards.
  const latestByCar = new Map()
  bids.forEach(bid => {
    const car = bid.car || bid.carId
    if (car?._id && !latestByCar.has(car._id)) latestByCar.set(car._id, bid)
  })

  const mapped = [...latestByCar.values()].map(b => {
    const car = b.car || b.carId || {}
    const isLeading = car.highestBidder?._id === user?.id || car.highestBidder?.toString() === user?.id
    const isEnded = car.status === 'ended'
    const status = isEnded && isLeading ? 'Won' : isLeading ? 'Leading' : 'Outbid'
    const secsLeft = Math.max(0, (new Date(car.auctionEnd) - Date.now()) / 1000)
    const h = Math.floor(secsLeft / 3600), m = Math.floor((secsLeft % 3600) / 60)
    const endsIn = isEnded ? 'Ended' : `${h}h ${m}m`
    return {
      id: car._id || b._id,
      car: `${car.make} ${car.model} ${car.year}`,
      img: car.images?.[0],
      myBid: b.amount,
      currentBid: car.currentBid,
      status,
      endsIn,
      bidders: car.bidCount || 0,
    }
  })

  const filtered = mapped.filter(b => filter === 'All' || b.status === filter)
  const leading = mapped.filter(b => b.status === 'Leading').length
  const outbid  = mapped.filter(b => b.status === 'Outbid').length
  const won     = mapped.filter(b => b.status === 'Won').length

  return (
    <AuctionLayout title="My Bids">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[
          { label: 'Total Bids',  value: loading || error ? '—' : bids.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Leading',     value: loading || error ? '—' : leading, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Outbid',      value: loading || error ? '—' : outbid, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-3 sm:p-5 shadow-sm text-center min-w-0`}>
            <div className={`text-2xl sm:text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
            <div className="text-gray-500 text-[11px] sm:text-sm leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5" aria-label="Filter bids">
        {['All', 'Leading', 'Outbid', 'Won'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>{f}</button>
        ))}
      </div>

      {/* Bids list */}
      {loading && <div className="text-center py-12 text-gray-400">Loading bids...</div>}
      <div className="space-y-3">
        {filtered.map(bid => {
          const cfg = statusConfig[bid.status]
          const Icon = cfg.icon
          const isLeading = bid.status === 'Leading'
          const isOutbid  = bid.status === 'Outbid'

          return (
            <article key={bid.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${
              isLeading ? 'border-green-200' : isOutbid ? 'border-red-200' : 'border-yellow-200'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <VehicleImage src={bid.img} alt={bid.car} className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl object-cover shrink-0" fallbackClassName="w-24 h-16 sm:w-28 sm:h-20 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1">
                    <h3 className="text-gray-900 font-bold text-sm leading-5 sm:truncate">{bid.car}</h3>
                    <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                      {bid.status}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                    isLeading ? 'text-green-600' : isOutbid ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    <Icon className="w-3 h-3" />{cfg.text}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-2"><Clock className="w-3 h-3" />{bid.endsIn}</span>
                </div>
                <div className="hidden sm:flex shrink-0 flex-col gap-2">
                  {isOutbid && (
                    <Link to={`/auction/car/${bid.id}`} className="btn-primary px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"><Gavel className="w-3 h-3" /> Rebid</Link>
                  )}
                  {isLeading && (
                    <Link to={`/auction/car/${bid.id}`} className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-green-100 transition-colors"><ArrowUpRight className="w-3 h-3" /> View</Link>
                  )}
                  {bid.status === 'Won' && (
                    <span className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Won</span>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                <div className="min-w-0"><dt className="text-[11px] text-gray-500">My bid</dt><dd className="font-bold text-gray-800 text-sm break-words">PKR {formatPKR(bid.myBid)}</dd></div>
                <div className="min-w-0"><dt className="text-[11px] text-gray-500">Current bid</dt><dd className={`font-bold text-sm break-words ${isOutbid ? 'text-red-600' : 'text-blue-600'}`}>PKR {formatPKR(bid.currentBid)}</dd></div>
              </dl>

              <div className="sm:hidden mt-3">
                {isOutbid && (
                  <Link to={`/auction/car/${bid.id}`}
                    className="btn-primary w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                    <Gavel className="w-3 h-3" /> Rebid
                  </Link>
                )}
                {isLeading && (
                  <Link to={`/auction/car/${bid.id}`}
                    className="w-full bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-green-100 transition-colors">
                    <ArrowUpRight className="w-3 h-3" /> View
                  </Link>
                )}
                {bid.status === 'Won' && (
                  <span className="w-full bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Won
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bids in this category.</p>
        </div>
      )}
    </AuctionLayout>
  )
}
