import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react'
import AuctionLayout from '../../components/AuctionLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import VehicleImage from '../../components/VehicleImage.jsx'

const statusConfig = {
  leading: { label: 'Leading', color: 'badge-green', icon: TrendingUp, text: 'You are leading' },
  outbid: { label: 'Outbid', color: 'badge-red', icon: TrendingDown, text: 'Another bidder is leading' },
  won: { label: 'Won', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: CheckCircle, text: 'You won!' },
  lost: { label: 'Lost', color: 'badge-red', icon: XCircle, text: 'Another bidder won' },
  unsold: { label: 'Unsold', color: 'bg-gray-100 text-gray-700', icon: XCircle, text: 'This auction ended without a sale' },
  upcoming: { label: 'Upcoming', color: 'bg-blue-50 text-blue-700', icon: Clock, text: 'Bidding has not started' },
  awaiting_result: { label: 'Awaiting result', color: 'bg-amber-50 text-amber-700', icon: Clock, text: 'Bidding is closed. Refresh to check the final result.' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle, text: 'This auction was cancelled' },
  unavailable: { label: 'Unavailable', color: 'bg-gray-100 text-gray-700', icon: XCircle, text: 'Auction result is unavailable' },
}

const finalStates = new Set(['won', 'lost', 'unsold'])
const timeLeft = (date, now) => {
  const seconds = Math.max(0, (new Date(date).getTime() - now) / 1000)
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export default function AuctionMyBidsPage() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    api.get('/member/bids')
      .then(res => setBids(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load your bids.'))
      .finally(() => setLoading(false))
  }, [])

  // A loaded live card must stop offering Rebid when its bidding window closes.
  useEffect(() => {
    if (!bids.some(bid => bid.auctionState?.biddingOpen)) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [bids])

  // The API returns every bid event. Show one card per auction while keeping
  // the total bid count accurate and avoiding duplicate React keys/cards.
  const latestByCar = new Map()
  bids.forEach((bid, index) => {
    const car = bid.car || bid.carId
    const key = car?._id || bid._id || `unavailable-${index}`
    if (!latestByCar.has(key)) latestByCar.set(key, bid)
  })

  const mapped = [...latestByCar.values()].map(b => {
    const car = b.car || b.carId
    let status = car?._id && Object.hasOwn(statusConfig, b.auctionState?.status)
      ? b.auctionState.status : 'unavailable'
    const startsAt = new Date(car?.auctionStart).getTime()
    const endsAt = new Date(car?.auctionEnd).getTime()
    const liveState = status === 'leading' || status === 'outbid'
    if (liveState && Number.isFinite(endsAt) && now >= endsAt) status = 'awaiting_result'
    const biddingOpen = liveState && b.auctionState?.biddingOpen === true && car?.status === 'active'
      && Number.isFinite(startsAt) && Number.isFinite(endsAt) && startsAt <= now && now < endsAt
    const endsIn = finalStates.has(status) || status === 'awaiting_result' ? 'Ended'
      : status === 'upcoming' && Number.isFinite(startsAt) ? `Starts in ${timeLeft(car.auctionStart, now)}`
        : biddingOpen ? `Ends in ${timeLeft(car.auctionEnd, now)}` : statusConfig[status].label
    return {
      id: car?._id || b._id,
      car: car?._id ? `${car.make} ${car.model} ${car.year}` : 'Auction unavailable',
      img: car?.images?.[0],
      myBid: b.amount,
      currentBid: car?.currentBid,
      status,
      endsIn,
      canRebid: status === 'outbid' && biddingOpen,
      detailsUrl: car?._id ? `/auction/car/${car._id}` : null,
    }
  })

  const filtered = mapped.filter(b => filter === 'All' || b.status === filter)
  const leading = mapped.filter(b => b.status === 'leading').length
  const outbid = mapped.filter(b => b.status === 'outbid').length
  const won = mapped.filter(b => b.status === 'won').length
  const filters = ['All', ...Object.keys(statusConfig).filter(status =>
    ['leading', 'outbid', 'won'].includes(status) || status === filter || mapped.some(bid => bid.status === status))]

  return (
    <AuctionLayout title="My Bids">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
        {[
          { label: 'Total Bids',  value: loading || error ? '—' : bids.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Leading',     value: loading || error ? '—' : leading, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Outbid',      value: loading || error ? '—' : outbid, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Won',         value: loading || error ? '—' : won, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-3 sm:p-5 shadow-sm text-center min-w-0`}>
            <div className={`text-2xl sm:text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
            <div className="text-gray-500 text-[11px] sm:text-sm leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter bids">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>{f === 'All' ? f : statusConfig[f].label}</button>
        ))}
      </div>

      {/* Bids list */}
      {loading && <div className="text-center py-12 text-gray-400">Loading bids...</div>}
      <div className="space-y-3">
        {filtered.map(bid => {
          const cfg = statusConfig[bid.status]
          const Icon = cfg.icon
          const isLeading = bid.status === 'leading'
          const isOutbid = bid.status === 'outbid'

          return (
            <article key={bid.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${
              isLeading ? 'border-green-200' : isOutbid || bid.status === 'lost' ? 'border-red-200'
                : bid.status === 'won' ? 'border-yellow-200' : 'border-gray-200'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <VehicleImage src={bid.img} alt={bid.car} className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl object-cover shrink-0" fallbackClassName="w-24 h-16 sm:w-28 sm:h-20 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1">
                    <h3 className="text-gray-900 font-bold text-sm leading-5 sm:truncate">{bid.car}</h3>
                    <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                    isLeading ? 'text-green-600' : isOutbid || bid.status === 'lost' ? 'text-red-600'
                      : bid.status === 'won' ? 'text-yellow-700' : 'text-gray-600'
                  }`}>
                    <Icon className="w-3 h-3" />{cfg.text}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-2"><Clock className="w-3 h-3" />{bid.endsIn}</span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                <div className="min-w-0"><dt className="text-[11px] text-gray-500">My bid</dt><dd className="font-bold text-gray-800 text-sm break-words">PKR {formatPKR(bid.myBid)}</dd></div>
                <div className="min-w-0"><dt className="text-[11px] text-gray-500">Current bid</dt><dd className={`font-bold text-sm break-words ${isOutbid ? 'text-red-600' : 'text-blue-600'}`}>{bid.currentBid == null ? '—' : `PKR ${formatPKR(bid.currentBid)}`}</dd></div>
              </dl>

              {bid.detailsUrl && <div className="mt-3 flex sm:justify-end">
                <Link to={bid.detailsUrl}
                  className={`${bid.canRebid ? 'btn-primary' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'} w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1`}>
                  {bid.canRebid ? <Gavel className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {bid.canRebid ? 'Rebid' : finalStates.has(bid.status) ? 'View result' : 'View details'}
                </Link>
              </div>}
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
