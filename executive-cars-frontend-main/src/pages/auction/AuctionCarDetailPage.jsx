import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronLeft, Gavel, FileText, Download, Users, Timer,
  Settings, Fuel, Gauge, Calendar, Palette, CheckCircle, Car,
  TrendingUp, Zap, Bell
} from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import CountdownTimer from '../../components/CountdownTimer.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import { hasInspectionReport } from '../../utils/inspectionReport.js'
import { connectSocket } from '../../api/socket.js'
import VehicleImage from '../../components/VehicleImage.jsx'
import { ConfirmationDialog } from '../../components/ui/Overlays.jsx'
import { bidValidationError, formatBidCount } from '../../utils/auction.js'
import { digitsOnly } from '../../utils/inputValidation.js'
import { openProtectedDocument } from '../../utils/documents.js'

function timeUntilWithDays(isoDate) {
  const diff = Math.max(0, Math.floor((new Date(isoDate) - Date.now()) / 1000))
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return { d, h, m, s }
}

function initials(name) {
  return (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function AuctionCarDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [currentBid, setCurrentBid] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [bidHistory, setBidHistory] = useState([])
  const [totalBidders, setTotalBidders] = useState(0)
  const [myBidPlaced, setMyBidPlaced] = useState(false)
  const [bidSuccess, setBidSuccess] = useState(false)
  const [bidError, setBidError] = useState('')
  const [liveActivity, setLiveActivity] = useState(null)
  const [outbidAlert, setOutbidAlert] = useState(false)
  const [auctionEnded, setAuctionEnded] = useState(false)
  const [auctionNotStarted, setAuctionNotStarted] = useState(false)
  const [wonResult, setWonResult] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [reportOpening, setReportOpening] = useState(false)
  const [reportError, setReportError] = useState('')
  const bidListRef = useRef(null)

  useEffect(() => {
    Promise.all([api.get(`/cars/${id}`), api.get(`/bids/${id}`)]).then(([carResponse, historyResponse]) => {
      const c = carResponse.data
      setCar(c)
      setCurrentBid(c.currentBid || c.basePrice)
      setTotalBidders(c.bidCount || 0)
      setAuctionEnded(c.status === 'ended' || new Date(c.auctionEnd).getTime() <= Date.now())
      setAuctionNotStarted(new Date(c.auctionStart).getTime() > Date.now())
      setBidHistory(historyResponse.data.map(bid => ({
        user: bid.bidder,
        avatar: initials(bid.bidder),
        amount: bid.amount,
        time: new Date(bid.createdAt).toLocaleString('en-PK'),
        isMe: bid.isMe,
      })))
    }).catch(err => setLoadError(err.response?.data?.message || 'Could not load this auction.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) return
    const socket = connectSocket()

    socket.emit('join-auction', id)

    socket.on('bid-update', ({ carId, currentBid: newBid, highestBidder, bidCount }) => {
      if (carId !== id) return
      setCurrentBid(newBid)
      setTotalBidders(bidCount)
      const isMe = highestBidder?._id === user?.id
      const displayName = isMe ? 'You' : (highestBidder?.name ? highestBidder.name.slice(0, 2) + '***' : 'Someone')
      const entry = {
        user: displayName,
        avatar: initials(highestBidder?.name || '??'),
        amount: newBid,
        time: 'Just now',
        isMe,
      }
      setBidHistory(h => [entry, ...h.slice(0, 9)])
      setLiveActivity(`${displayName} just bid PKR ${formatPKR(newBid)}!`)
      setTimeout(() => setLiveActivity(null), 4000)
    })

    socket.on('outbid', () => {
      setOutbidAlert(true)
      setTimeout(() => setOutbidAlert(false), 8000)
    })

    socket.on('auction-ended', ({ carId, finalBid, winner }) => {
      if (carId !== id) return
      setAuctionEnded(true)
      setCurrentBid(finalBid)
      setWonResult(winner && winner._id === user?.id ? winner : null)
    })

    return () => {
      socket.emit('leave-auction', id)
      socket.off('bid-update')
      socket.off('outbid')
      socket.off('auction-ended')
    }
  }, [id, user])

  useEffect(() => {
    bidListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [bidHistory])

  const minBid = currentBid + (car?.minimumBidIncrement || 50000)

  const handleBid = async (e) => {
    e.preventDefault()
    setBidError('')
    const amount = Number(bidAmount)
    const validationError = bidValidationError({ amount, minimumBid: minBid, auctionEnded, auctionNotStarted })
    if (validationError) { setBidError(validationError); return }
    setConfirmOpen(true)
  }

  const confirmBid = async () => {
    const amount = Number(bidAmount)
    setBidSubmitting(true)
    try {
      await api.post('/bids', { carId: id, amount })
      setMyBidPlaced(true)
      setBidSuccess(true)
      setBidAmount('')
      setConfirmOpen(false)
      setTimeout(() => setBidSuccess(false), 3000)
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to place bid. Try again.')
      setConfirmOpen(false)
    } finally {
      setBidSubmitting(false)
    }
  }

  const viewInspectionReport = async () => {
    if (reportOpening) return
    setReportError('')
    setReportOpening(true)
    try {
      await openProtectedDocument(car.inspectionReportAccessPath)
    } catch (error) {
      setReportError(error.response?.data?.message || 'The inspection report could not be opened.')
    } finally {
      setReportOpening(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading auction...</div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium mb-2">{loadError || 'Auction not found'}</p>
          <Link to="/auction/live" className="text-blue-600 hover:underline text-sm">Back to auctions</Link>
        </div>
      </div>
    )
  }

  const endsIn = timeUntilWithDays(car.auctionEnd)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/auction/live" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:block">Back to Auctions</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            {liveActivity && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full animate-fadeInUp font-medium">
                <Zap className="w-3 h-3 text-blue-500" />
                {liveActivity}
              </div>
            )}
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${auctionEnded ? 'bg-gray-100 border-gray-200 text-gray-600' : auctionNotStarted ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {!auctionEnded && !auctionNotStarted && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              {auctionEnded ? 'AUCTION ENDED' : auctionNotStarted ? 'SCHEDULED' : 'LIVE AUCTION'}
            </span>
          </div>
        </div>
      </div>

      {outbidAlert && !auctionEnded && (
        <div className="sticky top-16 z-10 bg-orange-500 text-white text-center text-sm font-semibold py-2 px-4">
          You've been outbid! Place a higher bid to stay in the lead.
        </div>
      )}

      {auctionEnded && (
        <div className={`sticky top-16 z-10 text-white text-center text-sm font-semibold py-2 px-4 ${wonResult ? 'bg-green-600' : 'bg-gray-700'}`}>
          {wonResult ? `Auction ended — you won this car for PKR ${formatPKR(currentBid)}!` : 'This auction has ended.'}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Images + Specs ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gallery */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/9] overflow-hidden">
                <VehicleImage src={car.images?.[activeImg]} alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {car.images?.length > 1 && (
                <div className="flex gap-2 p-3 bg-gray-50">
                  {car.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-blue-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <VehicleImage src={img} alt={`${car.make} ${car.model} view ${i + 1}`} className="w-full h-full object-cover" fallbackClassName="w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car title + specs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h1 className="text-gray-900 font-black text-2xl mb-1">{car.make} {car.model} {car.year}</h1>
              <p className="text-gray-500 text-sm mb-5">{car.km?.toLocaleString()} km · {car.color} · {car.transmission}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Settings, label: 'Engine', value: car.engine ? `${car.engine} cc` : '—' },
                  { icon: Fuel,     label: 'Fuel',   value: car.fuel },
                  { icon: Gauge,    label: 'Transmission', value: car.transmission },
                  { icon: Calendar, label: 'Year',   value: car.year },
                  { icon: Gauge,    label: 'Mileage', value: `${car.km?.toLocaleString()} km` },
                  { icon: Palette,  label: 'Color',  value: car.color },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">{label}</p>
                      <p className="text-gray-900 text-sm font-semibold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection Report */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-gray-900 font-bold">Inspection Report</h3>
                  {hasInspectionReport(car) && <span className="badge-green text-xs px-2 py-0.5 rounded-full font-medium">Report available</span>}
                </div>
                {hasInspectionReport(car) ? (
                  <button type="button" onClick={viewInspectionReport} disabled={reportOpening}
                    className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-60">
                    <Download className="w-3 h-3" /> {reportOpening ? 'Opening…' : 'Download PDF'}
                  </button>
                ) : (
                  <button disabled className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 opacity-50 cursor-not-allowed">
                    <Download className="w-3 h-3" /> No Report
                  </button>
                )}
              </div>
              {reportError && <p role="alert" className="text-xs text-red-600 mb-3">{reportError}</p>}
              {hasInspectionReport(car) ? <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="text-green-900 text-sm font-bold">An inspection document is attached to this auction.</p><p className="text-green-800 text-xs mt-1">Review the full report before bidding. An attached report is not a guarantee of vehicle condition.</p>{Number.isFinite(car.inspectionScore) && <p className="text-green-900 text-sm mt-3">Recorded inspection score: <strong>{car.inspectionScore}/100</strong></p>}</div> : <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-amber-900 text-sm font-bold">No inspection report is attached.</p><p className="text-amber-800 text-xs mt-1">Do not assume this vehicle has been inspected or verified.</p></div>}
            </div>

            {/* Description */}
            {car.description && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-gray-900 font-bold mb-3">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{car.description}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Live Bid Panel ── */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm sticky top-20">

              {/* Current bid */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Current Highest Bid</p>
                <p className="text-blue-600 font-black text-4xl leading-none">PKR {formatPKR(currentBid)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{formatBidCount(totalBidders)}</span>
                  </div>
                  {currentBid > car.basePrice && (
                    <div className="flex items-center gap-1.5 text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+PKR {formatPKR(currentBid - car.basePrice)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700 text-sm font-semibold">{auctionNotStarted ? 'Auction starts in' : 'Auction ends in'}</span>
                </div>
                <CountdownTimer endsIn={timeUntilWithDays(auctionNotStarted ? car.auctionStart : car.auctionEnd)} showDays={true} />
              </div>

              {/* Bid form */}
              {auctionEnded ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center mb-4">
                  <p className="text-gray-700 font-bold text-sm">Bidding is closed</p>
                  <p className="text-gray-500 text-xs mt-1">This auction has ended.</p>
                </div>
              ) : auctionNotStarted ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center mb-4">
                  <p className="text-yellow-800 font-bold text-sm">Auction has not started</p>
                  <p className="text-yellow-700 text-xs mt-1">Bidding opens {new Date(car.auctionStart).toLocaleString()}.</p>
                </div>
              ) : bidSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4 animate-scaleIn">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-bold text-sm">Bid Placed Successfully!</p>
                  <p className="text-green-600 text-xs mt-1">You are the highest bidder</p>
                </div>
              ) : (
                <form onSubmit={handleBid} className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your Bid <span className="text-gray-400 font-normal">(min: PKR {formatPKR(minBid)})</span>
                    </label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={bidAmount} onChange={e => setBidAmount(digitsOnly(e.target.value, 10))}
                      placeholder={`PKR ${formatPKR(minBid)}`}
                      className={`input-light ${bidError ? 'border-red-400' : ''}`} />
                    {bidError && <p className="text-red-500 text-xs mt-1">{bidError}</p>}
                  </div>
                  <div className="flex gap-2">
                    {[minBid, minBid + 100000, minBid + 200000].map(amt => (
                      <button key={amt} type="button" onClick={() => setBidAmount(String(amt))}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                        {formatPKR(amt)}
                      </button>
                    ))}
                  </div>
                  <button type="submit"
                    disabled={bidSubmitting}
                    className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-60">
                    <Gavel className="w-4 h-4" /> Place Bid
                  </button>
                </form>
              )}

              {myBidPlaced && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-blue-700 text-xs">Outbid updates appear here while this auction page is connected.</p>
                </div>
              )}

              {/* Live bid history */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-gray-900 font-bold text-sm">Live Bid Feed</h4>
                  <span className={`flex items-center gap-1 text-xs font-medium ${auctionEnded ? 'text-gray-500' : 'text-green-600'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                  </span>
                </div>
                <div ref={bidListRef} className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {bidHistory.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-4">No bids yet. Be the first!</p>
                  ) : bidHistory.map((bid, i) => (
                    <div key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        i === 0 ? 'bg-blue-50 border border-blue-200' :
                        bid.isMe ? 'bg-green-50 border border-green-200' :
                        'bg-gray-50 border border-gray-100'
                      }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        bid.isMe ? 'bg-green-600 text-white' :
                        i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {bid.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 text-xs font-semibold">{bid.user}</span>
                          {bid.isMe && <span className="text-green-600 text-xs">(You)</span>}
                          {i === 0 && !bid.isMe && <span className="text-blue-600 text-xs">🏆 Leading</span>}
                        </div>
                        <p className="text-gray-400 text-xs">{bid.time}</p>
                      </div>
                      <span className={`font-bold text-sm shrink-0 ${
                        bid.isMe ? 'text-green-600' : i === 0 ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        PKR {formatPKR(bid.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => !bidSubmitting && setConfirmOpen(false)}
        onConfirm={confirmBid}
        loading={bidSubmitting}
        title="Confirm your bid"
        description={`Place a bid of PKR ${formatPKR(Number(bidAmount || 0))} on ${car.make} ${car.model}? This action is recorded in the auction history.`}
        confirmLabel="Place bid"
      />
    </div>
  )
}
