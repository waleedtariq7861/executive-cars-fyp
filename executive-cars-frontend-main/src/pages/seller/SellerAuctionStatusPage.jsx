import React, { useState, useEffect } from 'react'
import { Gavel } from 'lucide-react'
import SellerLayout from '../../components/SellerLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'

const statusClass = { active: 'badge-green', upcoming: 'badge-blue', ended: 'badge-red' }

function timeLeftLabel(isoDate) {
  const diff = new Date(isoDate) - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86400000)
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m`
}

export default function SellerAuctionStatusPage() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/seller/auction-status')
      .then(res => setAuctions(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load auction status.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <SellerLayout title="Auction Status">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold text-lg">My Cars in Auction</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track live bids on your vehicles.</p>
        </div>
        <div className="overflow-x-auto responsive-record-table-wrap">
          <table className="w-full text-sm responsive-record-table">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Car', 'Start Bid', 'Current Bid', 'Bidders', 'Ends In', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="responsive-record-empty text-center py-12 text-gray-400">Loading auctions...</td></tr>
              ) : auctions.length === 0 ? (
                <tr><td colSpan={6} className="responsive-record-empty text-center py-12 text-gray-400">No cars in auction yet</td></tr>
              ) : auctions.map(a => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                  <td data-label="Vehicle" className="px-5 py-4 text-gray-900 font-medium">{a.make} {a.model} {a.year}</td>
                  <td data-label="Base price" className="px-5 py-4 text-gray-600">PKR {formatPKR(a.basePrice)}</td>
                  <td data-label="Current bid" className="px-5 py-4 text-blue-600 font-bold">PKR {formatPKR(a.currentBid)}</td>
                  <td data-label="Bids" className="px-5 py-4 text-gray-600">
                    <span className="flex items-center gap-1"><Gavel className="w-3 h-3" />{a.bidCount}</span>
                  </td>
                  <td data-label="Time left" className="px-5 py-4 text-gray-600">{timeLeftLabel(a.auctionEnd)}</td>
                  <td data-label="Status" className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 ${statusClass[a.status] || 'badge-blue'} text-xs px-2.5 py-1 rounded-full font-medium`}>
                      {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SellerLayout>
  )
}
