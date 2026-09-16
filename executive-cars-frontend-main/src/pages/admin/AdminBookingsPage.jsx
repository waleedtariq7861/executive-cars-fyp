import React, { useState, useEffect } from 'react'
import { Eye, Check, X, Search, Calendar } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import api from '../../api/api.js'
import { openProtectedDocument } from '../../utils/documents.js'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [error, setError] = useState('')

  const fetchBookings = () => {
    setLoading(true)
    setError('')
    const params = {}
    if (statusFilter !== 'All') params.status = statusFilter.toLowerCase()
    if (search) params.search = search
    api.get('/admin/bookings', { params })
      .then(res => setBookings(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load bookings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [statusFilter])

  const filtered = bookings.filter(b => {
    if (!search) return true
    return b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.carMake?.toLowerCase().includes(search.toLowerCase()) ||
      b.carModel?.toLowerCase().includes(search.toLowerCase())
  })

  const updateStatus = async (id, status) => {
    try {
      setError('')
      await api.patch(`/admin/bookings/${id}`, { status })
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update booking status.')
    }
  }

  const viewDocument = async accessPath => {
    try {
      setError('')
      await openProtectedDocument(accessPath)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open this private document.')
    }
  }

  const statusColor = (s) => {
    if (['approved', 'confirmed', 'completed'].includes(s)) return 'bg-green-500/15 text-green-600 border-green-500/30'
    if (['rejected', 'cancelled'].includes(s)) return 'bg-red-500/15 text-red-500 border-red-500/30'
    return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
  }

  return (
    <AdminLayout title="Inspection Bookings">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending',  value: bookings.filter(b => b.status === 'pending').length,  color: 'text-yellow-500' },
          { label: 'Approved', value: bookings.filter(b => b.status === 'approved').length, color: 'text-green-500'  },
          { label: 'Rejected', value: bookings.filter(b => b.status === 'rejected').length, color: 'text-red-500'    },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search seller or car..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'btn-primary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading bookings...</div>
        ) : (
          <div className="overflow-x-auto responsive-record-table-wrap">
            <table className="w-full responsive-record-table">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Seller', 'Car', 'Date', 'Branch', 'Documents', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-gray-500 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="responsive-record-empty text-center py-12 text-gray-400">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td data-label="Seller" className="px-4 py-4">
                      <p className="text-gray-900 font-medium text-sm">{b.name}</p>
                      <p className="text-gray-500 text-xs">{b.phone}</p>
                    </td>
                    <td data-label="Vehicle" className="px-4 py-4 text-gray-700 text-sm">{b.carMake} {b.carModel} {b.carYear}</td>
                    <td data-label="Date" className="px-4 py-4 text-gray-500 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</div>
                    </td>
                    <td data-label="Branch" className="px-4 py-4 text-gray-500 text-sm">{b.branch}</td>
                    <td data-label="Documents" className="px-4 py-4">
                      <div className="flex gap-2">
                        {b.hasCnicDocument ? (
                          <button type="button" onClick={() => viewDocument(b.cnicDocumentAccessPath)} aria-label={`View ${b.name} CNIC document`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Eye className="w-3 h-3" /> CNIC
                          </button>
                        ) : <span className="text-xs text-gray-400">No CNIC</span>}
                        {b.hasRegistrationDocument ? (
                          <button type="button" onClick={() => viewDocument(b.registrationDocumentAccessPath)} aria-label={`View ${b.name} registration document`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Eye className="w-3 h-3" /> Reg
                          </button>
                        ) : <span className="text-xs text-gray-400">No Reg</span>}
                      </div>
                    </td>
                    <td data-label="Status" className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(b.status)}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                    <td data-label="Actions" className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && <>
                          <button onClick={() => updateStatus(b._id, 'approved')}
                            className="w-7 h-7 rounded-lg bg-green-500/15 text-green-500 hover:bg-green-500/25 flex items-center justify-center transition-all" title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateStatus(b._id, 'rejected')}
                            className="w-7 h-7 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 flex items-center justify-center transition-all" title="Reject">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>}
                        <select aria-label={`Update ${b.name} booking status`} value={b.status} onChange={event => updateStatus(b._id, event.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
                          {['pending', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled'].map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
