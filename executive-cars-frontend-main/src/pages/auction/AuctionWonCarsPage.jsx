import React, { useState, useEffect } from 'react'
import { Trophy, Phone, CheckCircle, Calendar } from 'lucide-react'
import AuctionLayout from '../../components/AuctionLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'

export default function AuctionWonCarsPage() {
  const [wonCars, setWonCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/member/won')
      .then(res => setWonCars(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load won cars.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuctionLayout title="Won Cars">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Won',        value: wonCars.length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
          { label: 'Total Winning Value', value: wonCars.length ? `PKR ${formatPKR(wonCars.reduce((sum, car) => sum + (car.currentBid || 0), 0))}` : '—', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-2xl p-5 shadow-sm text-center`}>
            <div className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading won cars...</div>}
      {!loading && wonCars.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-lg text-gray-500">No won cars yet</p>
          <p className="text-sm mt-1">Start bidding on live auctions to win your first car!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {wonCars.map(car => (
            <div key={car._id} className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row">
                {car.images?.[0] && <img src={car.images[0]} alt={`${car.make} ${car.model}`} className="w-full sm:w-48 h-36 object-cover shrink-0" />}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <h3 className="text-gray-900 font-bold text-lg">{car.make} {car.model} {car.year}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          Auction Ended
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Ended {new Date(car.auctionEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Winning Bid</p>
                      <p className="text-blue-600 font-black text-2xl">PKR {formatPKR(car.currentBid)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      car.km && `${car.km.toLocaleString()} km`,
                      car.engine && `${car.engine}cc`,
                      car.transmission,
                      car.color,
                    ].filter(Boolean).map(v => (
                      <span key={v} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-3 py-1 rounded-lg font-medium">{v}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a href={`mailto:${car.sellerEmail}`}
                      className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-green-100 transition-colors">
                      <Phone className="w-4 h-4" /> Contact Seller
                    </a>
                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> You won this auction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AuctionLayout>
  )
}
