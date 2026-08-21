import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react'
import AuctionLayout from '../../components/AuctionLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import { useAuth } from '../../context/authContext.js'

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
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Bids',  value: bids.length,   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
          { label: 'Leading',     value: leading,        color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
          { label: 'Outbid',      value: outbid,         color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'    },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-5 shadow-sm text-center`}>
            <div className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
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
            <div key={bid.id} className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 ${
              isLeading ? 'border-green-200' : isOutbid ? 'border-red-200' : 'border-yellow-200'
            }`}>
              <img src={bid.img} alt={bid.car} className="w-20 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-gray-900 font-bold text-sm truncate">{bid.car}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                    {bid.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>My bid: <span className="font-semibold text-gray-700">PKR {formatPKR(bid.myBid)}</span></span>
                  <span>Current: <span className={`font-semibold ${isOutbid ? 'text-red-600' : 'text-blue-600'}`}>PKR {formatPKR(bid.currentBid)}</span></span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{bid.endsIn}</span>
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                  isLeading ? 'text-green-600' : isOutbid ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  <Icon className="w-3 h-3" />{cfg.text}
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                {isOutbid && (
                  <Link to={`/auction/car/${bid.id}`}
                    className="btn-primary px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Gavel className="w-3 h-3" /> Rebid
                  </Link>
                )}
                {isLeading && (
                  <Link to={`/auction/car/${bid.id}`}
                    className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-green-100 transition-colors">
                    <ArrowUpRight className="w-3 h-3" /> View
                  </Link>
                )}
                {bid.status === 'Won' && (
                  <span className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Won
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bids in this category.</p>
        </div>
      )}
    </AuctionLayout>
  )
}
