import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Clock, PlusCircle, XCircle } from 'lucide-react'
import SellerLayout from '../../components/SellerLayout.jsx'
import api from '../../api/api.js'

const statusConfig = {
  approved: { icon: CheckCircle, class: 'badge-green' },
  confirmed:{ icon: CheckCircle, class: 'badge-green' },
  completed:{ icon: CheckCircle, class: 'badge-green' },
  pending:  { icon: Clock,       class: 'badge-yellow' },
  rejected: { icon: XCircle,     class: 'badge-red' },
  cancelled:{ icon: XCircle,     class: 'badge-red' },
}

export default function SellerBookingsPage() {
  const location = useLocation()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/seller/bookings')
      .then(res => setBookings(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load your bookings.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <SellerLayout title="My Bookings">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {location.state?.bookingCreated && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Inspection booking submitted successfully.</p>
            <p className="text-xs text-green-600 mt-1">{location.state.date}{location.state.time ? ` · ${location.state.time}` : ''} · {location.state.branch}. You can track its approval status here.</p>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Inspection Bookings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Track your vehicle inspection requests.</p>
          </div>
          <Link to="/seller/book-inspection" className="btn-primary px-4 py-2.5 text-sm gap-2 shrink-0">
            <PlusCircle className="w-4 h-4" /> Book Inspection
          </Link>
        </div>
        <div className="overflow-x-auto responsive-record-table-wrap">
          <table className="w-full text-sm responsive-record-table">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Car', 'Inspection Date', 'Branch', 'Submitted On', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="responsive-record-empty text-center py-12 text-gray-400">Loading bookings...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={5} className="responsive-record-empty text-center py-12 text-gray-400">No bookings yet</td></tr>
              ) : bookings.map(b => {
                const { icon: Icon, class: cls } = statusConfig[b.status] || statusConfig.pending
                return (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td data-label="Vehicle" className="px-5 py-4 text-gray-900 font-medium">{b.carMake} {b.carModel} {b.carYear}</td>
                    <td data-label="Inspection date" className="px-5 py-4 text-gray-600">{b.date}{b.time ? <span className="block text-xs text-gray-400 mt-1">{b.time}</span> : null}</td>
                    <td data-label="Branch" className="px-5 py-4 text-gray-600">{b.branch}</td>
                    <td data-label="Booked on" className="px-5 py-4 text-gray-600">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td data-label="Status" className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 ${cls} text-xs px-2.5 py-1 rounded-full font-medium`}>
                        <Icon className="w-3 h-3" /> {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SellerLayout>
  )
}
