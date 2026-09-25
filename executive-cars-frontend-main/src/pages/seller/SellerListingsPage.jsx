import React, { useState, useEffect } from 'react'
import SellerLayout from '../../components/SellerLayout.jsx'
import { formatPKR } from '../../utils/format.js'
import api from '../../api/api.js'
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx'
import { formatBidCount } from '../../utils/auction.js'

const statusClass = { active: 'badge-green', available: 'badge-blue', sold: 'badge-yellow', ended: 'bg-gray-100 text-gray-600 border border-gray-200' }

export default function SellerListingsPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/seller/listings')
      .then(({ data }) => {
        setListings([...(data.auctionCars || []), ...(data.usedCars || [])])
      })
      .catch(err => setError(err.response?.data?.message || 'Could not load your listings.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <SellerLayout title="My Listings"><div className="space-y-4">{[1, 2, 3].map(item => <Skeleton key={item} className="h-28" />)}</div></SellerLayout>
  }

  return (
    <SellerLayout title="My Listings">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      <div className="flex items-end justify-between gap-4 mb-4"><div><h2 className="text-gray-900 font-bold text-lg">Published inventory</h2><p className="text-gray-500 text-sm">Listings assigned to your account by an administrator.</p></div></div>
      {listings.length === 0 ? (
        <EmptyState title="No published listings yet" description="Managed listings will appear here after showroom inspection, preparation, and administrator publishing." className="bg-white border border-gray-200 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {listings.map(listing => {
            const isAuction = !!listing.auctionEnd
            return (
              <div key={listing._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm card-hover">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {listing.images?.[0] && <img src={listing.images[0]} alt={`${listing.make} ${listing.model}`} loading="lazy" className="w-full h-full object-cover" />}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`${statusClass[listing.status] || 'badge-blue'} text-xs px-2.5 py-1 rounded-full font-medium`}>
                      {listing.status?.charAt(0).toUpperCase() + listing.status?.slice(1)}
                    </span>
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">{isAuction ? 'Auction' : 'Used Car'}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-gray-900 font-bold">{listing.make} {listing.model} {listing.year}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs">{isAuction ? 'Current Bid' : 'Asking Price'}</p>
                      <p className="text-blue-600 font-black text-lg">
                        PKR {formatPKR(isAuction ? listing.currentBid : listing.price)}
                      </p>
                    </div>
                    {isAuction && listing.bidCount > 0 && (
                      <p className="text-gray-400 text-xs">{formatBidCount(listing.bidCount)}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SellerLayout>
  )
}
