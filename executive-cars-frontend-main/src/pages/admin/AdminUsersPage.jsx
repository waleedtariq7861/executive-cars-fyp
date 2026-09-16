import React, { useState, useEffect } from 'react'
import { Search, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import api from '../../api/api.js'
import { ConfirmationDialog } from '../../components/ui/Overlays.jsx'

function getInitials(name) { return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }

export default function AdminUsersPage() {
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const PER_PAGE = 20

  const fetchMembers = () => {
    setLoading(true)
    setError('')
    const params = { page, limit: PER_PAGE }
    if (search) params.search = search
    if (statusFilter !== 'All') params.status = statusFilter.toLowerCase()
    api.get('/admin/members', { params })
      .then(res => { setMembers(res.data.members); setTotal(res.data.total) })
      .catch(err => setError(err.response?.data?.message || 'Could not load customer accounts.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMembers() }, [page, statusFilter])

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      if (page === 1) fetchMembers()
      else setPage(1)
    }
  }

  const confirmDelete = async () => {
    try {
      setError('')
      await api.delete(`/admin/members/${deleteTarget._id}`)
      setMembers(prev => prev.filter(m => m._id !== deleteTarget._id))
      setTotal(t => t - 1)
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete customer account.')
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <AdminLayout title="Customer Accounts">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Accounts', value: total,  color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Auction Active',  value: members.filter(m => m.subscriptionStatus === 'active').length,  color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Auction Inactive', value: members.filter(m => m.subscriptionStatus !== 'active').length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'This Page', value: members.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch} aria-label="Search customer accounts"
            placeholder="Search by name or email... (Enter to search)"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm" />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Inactive'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading accounts...</div>
        ) : (
          <div className="overflow-x-auto responsive-record-table-wrap">
            <table className="w-full responsive-record-table">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Account', 'Phone', 'Auction Access', 'Joined', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} className="responsive-record-empty text-center py-12 text-gray-400">No members found</td></tr>
                ) : members.map(m => (
                  <tr key={m._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td data-label="Member" className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{getInitials(m.name)}</div>
                        <div>
                          <p className="text-gray-900 font-medium text-sm">{m.name}</p>
                          <p className="text-gray-500 text-xs">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Phone" className="px-5 py-4 text-gray-600 text-sm">{m.phone || '—'}</td>
                    <td data-label="Subscription" className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.subscriptionStatus === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {m.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Joined" className="px-5 py-4 text-gray-500 text-sm">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td data-label="Actions" className="px-5 py-4">
                      <button type="button" onClick={() => setDeleteTarget(m)} aria-label={`Delete ${m.name}`} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center ml-auto transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
            <span className="text-gray-500 text-sm">{total} members</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm transition-all ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete customer account?"
        description={deleteTarget ? `Delete ${deleteTarget.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        dangerous
      />
    </AdminLayout>
  )
}
