import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Flame, Gavel, Search } from 'lucide-react'
import AuctionLayout from '../../components/AuctionLayout.jsx'
import CountdownTimer from '../../components/CountdownTimer.jsx'
import VehicleImage from '../../components/VehicleImage.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import { hasInspectionReport } from '../../utils/inspectionReport.js'
import { formatBidCount } from '../../utils/auction.js'

function timeUntil(isoDate) {
  const diff = Math.max(0, Math.floor((new Date(isoDate) - Date.now()) / 1000))
  return { d: Math.floor(diff / 86400), h: Math.floor((diff % 86400) / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 }
}

const phases = [
  { value: 'live', label: 'Live auctions' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ended', label: 'Ended' },
]

const phaseTone = {
  live: 'bg-green-600 text-white',
  upcoming: 'bg-amber-500 text-white',
  ended: 'bg-gray-700 text-white',
}

function AuctionCard({ car, phase }) {
  const isHot = phase === 'live' && car.bidCount > 3
  const countTo = phase === 'upcoming' ? car.auctionStart : car.auctionEnd
  const reserveText = car.reservePrice
    ? (car.currentBid >= car.reservePrice ? 'Reserve met' : 'Reserve not met')
    : null

  return (
    <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm card-hover group">
      <Link to={`/auction/car/${car._id}`} className="block relative aspect-[16/9] overflow-hidden">
        <VehicleImage src={car.images?.[0]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {isHot && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold"><Flame className="w-3 h-3" /> Active bidding</span>}
          <span className={`${phaseTone[phase]} text-xs px-2.5 py-1 rounded-full font-bold capitalize`}>{phase}</span>
        </div>
        <div className="absolute bottom-3 left-3"><p className="text-white/75 text-[11px] font-semibold mb-1">{phase === 'upcoming' ? 'Starts in' : phase === 'live' ? 'Ends in' : 'Ended'}</p>{phase !== 'ended' && <CountdownTimer endsIn={timeUntil(countTo)} showDays />}</div>
      </Link>
      <div className="p-4">
        <div className="flex justify-between gap-3"><div><h3 className="text-gray-950 font-black">{car.make} {car.model} {car.year}</h3><p className="text-gray-500 text-xs mt-1">{car.km?.toLocaleString('en-PK')} km · {car.transmission} · {car.engine} cc</p></div>{hasInspectionReport(car) && <span className="badge-blue text-xs self-start px-2 py-1 rounded-full font-bold">Report</span>}</div>
        <div className="flex items-end justify-between gap-3 mt-4"><div><p className="text-gray-400 text-xs">{phase === 'upcoming' ? 'Starting bid' : phase === 'ended' ? 'Final bid' : 'Current bid'}</p><p className="text-blue-700 font-black text-lg">PKR {formatPKR(phase === 'upcoming' ? car.basePrice : car.currentBid)}</p><p className="text-gray-400 text-xs mt-0.5">{formatBidCount(car.bidCount)}{reserveText ? ` · ${reserveText}` : ''}</p></div><Link to={`/auction/car/${car._id}`} className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold gap-1"><Gavel className="w-3.5 h-3.5" /> {phase === 'live' ? 'Bid now' : 'View details'}</Link></div>
      </div>
    </article>
  )
}

export default function AuctionLiveAuctionsPage() {
  const [phase, setPhase] = useState('live')
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('time')
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    api.get('/cars', { params: { phase, status: phase === 'ended' ? '' : 'active' } })
      .then(response => { if (active) setCars(response.data) })
      .catch(error => { if (active) setLoadError(error.response?.data?.message || `Could not load ${phase} auctions.`) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [phase, refreshKey])

  const filtered = useMemo(() => cars
    .filter(car => `${car.make} ${car.model} ${car.variant || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === 'bid-high') return (b.currentBid || b.basePrice) - (a.currentBid || a.basePrice)
      if (sort === 'bid-low') return (a.currentBid || a.basePrice) - (b.currentBid || b.basePrice)
      if (sort === 'bidders') return b.bidCount - a.bidCount
      const field = phase === 'upcoming' ? 'auctionStart' : 'auctionEnd'
      return phase === 'ended' ? new Date(b[field]) - new Date(a[field]) : new Date(a[field]) - new Date(b[field])
    }), [cars, search, sort, phase])

  return (
    <AuctionLayout title="Auctions">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto" role="tablist" aria-label="Auction phase">{phases.map(item => <button key={item.value} type="button" role="tab" aria-selected={phase === item.value} onClick={() => setPhase(item.value)} className={`min-h-10 px-4 rounded-lg text-xs font-bold whitespace-nowrap ${phase === item.value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{item.label}</button>)}</div>
          <div className="flex flex-col sm:flex-row gap-2"><label className="relative"><span className="sr-only">Search auctions</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search make or model" className="input-light pl-10 sm:w-56" /></label><select value={sort} onChange={event => setSort(event.target.value)} className="input-light sm:w-44" aria-label="Sort auctions"><option value="time">{phase === 'ended' ? 'Recently ended' : 'Time'}</option><option value="bid-high">Highest bid</option><option value="bid-low">Lowest bid</option><option value="bidders">Most bids</option></select></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">{filtered.length} {phase} auction{filtered.length === 1 ? '' : 's'}</p>
      </div>

      {loadError ? <div className="bg-white border border-gray-200 rounded-2xl"><ErrorState title="Auctions unavailable" description={loadError} onRetry={() => setRefreshKey(value => value + 1)} /></div> : loading ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{[1, 2, 3, 4, 5, 6].map(item => <div key={item} className="bg-white border border-gray-200 rounded-2xl p-3"><Skeleton className="aspect-video" /><Skeleton className="h-5 w-2/3 mt-4" /><Skeleton className="h-10 mt-4" /></div>)}</div> : filtered.length ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.map(car => <AuctionCard key={car._id} car={car} phase={phase} />)}</div> : <div className="bg-white border border-gray-200 rounded-2xl"><EmptyState icon={phase === 'upcoming' ? CalendarClock : Gavel} title={`No ${phase} auctions`} description={search ? 'No auction matches this search.' : `There are no ${phase} auctions at the moment.`} /></div>}
    </AuctionLayout>
  )
}
