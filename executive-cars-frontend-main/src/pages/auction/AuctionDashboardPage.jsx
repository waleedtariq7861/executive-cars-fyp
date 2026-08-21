import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, TrendingUp, Trophy, Clock, Flame, ArrowUpRight } from 'lucide-react'
import AuctionLayout from '../../components/AuctionLayout.jsx'
import CountdownTimer from '../../components/CountdownTimer.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'

function timeUntil(isoDate) {
  const diff = Math.max(0, Math.floor((new Date(isoDate) - Date.now()) / 1000))
  return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 }
}

const AuctionCard = React.memo(function AuctionCard({ car }) {
  const endsIn = timeUntil(car.auctionEnd)
  const isHot = car.bidCount > 3
  return (
    <Link to={`/auction/car/${car._id}`}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden card-hover group shadow-sm">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img src={car.images?.[0]} alt={`${car.make} ${car.model}`} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {isHot && (
            <span className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
              <Flame className="w-3 h-3" /> Hot
            </span>
          )}
          <span className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <CountdownTimer endsIn={endsIn} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-gray-900 font-bold">{car.make} {car.model} {car.year}</h3>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-gray-400 text-xs">Current Bid</p>
            <p className="text-blue-600 font-black text-lg">PKR {formatPKR(car.currentBid)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">{car.bidCount} bids</p>
            <button className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold mt-1 flex items-center gap-1">
              <Gavel className="w-3 h-3" /> Bid Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
})

export default function AuctionDashboardPage() {
  const [cars, setCars] = useState([])
  const [memberStats, setMemberStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/cars'), api.get('/member/stats'), api.get('/member/profile')])
      .then(([carsResponse, statsResponse, profileResponse]) => {
        setCars(carsResponse.data)
        setMemberStats(statsResponse.data)
        setProfile(profileResponse.data)
      })
      .catch(err => setLoadError(err.response?.data?.message || 'Could not load auction dashboard.'))
  }, [])

  const daysLeft = profile?.subscriptionExpiry
    ? Math.max(0, Math.ceil((new Date(profile.subscriptionExpiry) - Date.now()) / (1000 * 60 * 60 * 24)))
    : '—'

  const stats = [
    { icon: Gavel,      label: 'Active Auctions', value: cars.length,                  bg: 'bg-blue-50',   color: 'text-blue-600',   border: 'border-blue-200'   },
    { icon: TrendingUp, label: 'My Total Bids',   value: memberStats?.totalBids ?? 0,  bg: 'bg-green-50',  color: 'text-green-600',  border: 'border-green-200'  },
    { icon: Trophy,     label: 'Auctions Won',    value: memberStats?.wonCars ?? 0,    bg: 'bg-yellow-50', color: 'text-yellow-600', border: 'border-yellow-200' },
    { icon: Clock,      label: 'Days Left',       value: daysLeft,                     bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-200' },
  ]

  const displayed = cars.slice(0, 6)

  const filtered = useMemo(() => {
    const now = Date.now()
    if (filter === 'Hot') return displayed.filter(a => a.bidCount > 3)
    if (filter === 'Ending Soon') return displayed.filter(a => new Date(a.auctionEnd) - now < 2 * 3600 * 1000)
    return displayed
  }, [filter, displayed])

  return (
    <AuctionLayout title="Dashboard">
      {loadError && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{loadError}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-5 shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-gray-900 font-bold text-xl">Live Auctions</h2>
          <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['All', 'Hot', 'Ending Soon'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>{f}</button>
            ))}
          </div>
          <Link to="/auction/live" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 ml-2">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No active auctions right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(car => <AuctionCard key={car._id} car={car} />)}
        </div>
      )}
    </AuctionLayout>
  )
}
