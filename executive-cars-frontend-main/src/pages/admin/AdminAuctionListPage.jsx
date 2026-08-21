import React, { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2, X, AlertTriangle, Eye, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminOwnerSelect, { ownerValue, useAdminOwners } from '../../components/AdminOwnerSelect.jsx'
import { formatPKR } from '../../utils/format.js'
import { digitsOnly } from '../../utils/inputValidation.js'
import api from '../../api/api.js'

const toLocalDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function AdminAuctionListPage() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const { owners, loadingOwners } = useAdminOwners()

  useEffect(() => {
    api.get('/admin/cars')
      .then(res => setAuctions(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load auctions.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = auctions.filter(a => {
    const ownerText = `${a.ownerId?.name || ''} ${a.ownerId?.email || a.sellerEmail || ''}`
    const matchSearch = `${a.make} ${a.model} ${ownerText}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || a.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  const confirmDelete = async () => {
    try {
      setError('')
      await api.delete(`/admin/cars/${deleteTarget._id}`)
      setAuctions(prev => prev.filter(a => a._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete auction.')
    }
  }

  const saveEdit = async () => {
    try {
      setError('')
      const payload = {
        make: editTarget.make,
        model: editTarget.model,
        year: Number(editTarget.year),
        basePrice: Number(editTarget.basePrice),
        auctionEnd: new Date(editTarget.auctionEnd).toISOString(),
        ownerId: ownerValue(editTarget.ownerId),
      }
      const { data } = await api.put(`/admin/cars/${editTarget._id}`, payload)
      setAuctions(prev => prev.map(a => a._id === editTarget._id ? data : a))
      setEditTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update auction.')
    }
  }

  const getDaysLeft = (endDate) => Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))

  const viewResults = async (auction) => {
    setResultsLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/admin/cars/${auction._id}/results`)
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load auction results.')
    } finally { setResultsLoading(false) }
  }

  const closeAuction = async (auction) => {
    if (!window.confirm(`Close the auction for ${auction.make} ${auction.model}? This stops further bids.`)) return
    try {
      setError('')
      const { data } = await api.post(`/admin/cars/${auction._id}/close`)
      setAuctions(prev => prev.map(item => item._id === auction._id ? data.auction : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close auction.')
    }
  }

  return (
    <AdminLayout title="Auction List">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search car..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'Ended'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'btn-primary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <Link to="/admin/upload-auction" className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add New Auction
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading auctions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Car', 'Owner', 'Year', 'Base Price', 'Current Bid', 'End Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-gray-500 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400"><Search className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No auctions found.</p></td></tr>
                ) : filtered.map(a => {
                  const daysLeft = getDaysLeft(a.auctionEnd)
                  return (
                    <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-black text-sm">{a.make?.[0]}</div>
                          <span className="text-gray-900 font-medium text-sm">{a.make} {a.model}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-700 text-sm font-medium">{a.ownerId?.name || 'Executive Cars'}</p>
                        <p className="text-gray-400 text-xs">{a.ownerId?.email || a.sellerEmail || 'Showroom owned'}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-sm">{a.year}</td>
                      <td className="px-4 py-4 text-gray-700 text-sm">PKR {formatPKR(a.basePrice)}</td>
                      <td className="px-4 py-4 text-blue-600 font-bold text-sm">PKR {formatPKR(a.currentBid)}</td>
                      <td className="px-4 py-4">
                        <div className="text-gray-500 text-sm">{a.auctionEnd ? new Date(a.auctionEnd).toLocaleDateString() : '—'}</div>
                        {a.status === 'active' && (
                          <span className={`text-xs font-medium ${daysLeft <= 2 ? 'text-red-400' : 'text-gray-500'}`}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Ending today'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          a.status === 'active' ? 'bg-green-500/15 text-green-600 border-green-500/30' : 'bg-gray-500/15 text-gray-500 border-gray-300'
                        }`}>{a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button aria-label={`View results for ${a.make} ${a.model}`} onClick={() => viewResults(a)} className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 flex items-center justify-center transition-all"><Eye className="w-3.5 h-3.5" /></button>
                          {a.status === 'active' && <button aria-label={`Close ${a.make} ${a.model} auction`} onClick={() => closeAuction(a)} className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 flex items-center justify-center transition-all"><Lock className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => setEditTarget(a)} className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 flex items-center justify-center transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(a)} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full animate-scaleIn text-center shadow-2xl">
            <button onClick={() => setDeleteTarget(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-gray-900 font-bold text-xl mb-2">Delete Auction?</h3>
            <p className="text-gray-500 text-sm mb-6">Remove <span className="text-gray-900 font-medium">{deleteTarget.make} {deleteTarget.model}</span> from auctions?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1 py-3 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative w-full max-w-md bg-white border-l border-gray-200 h-full overflow-y-auto p-6 animate-fadeInRight">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-bold text-lg">Edit Auction</h3>
              <button onClick={() => setEditTarget(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <AdminOwnerSelect
                value={editTarget.ownerId}
                onChange={value => setEditTarget(prev => ({ ...prev, ownerId: value }))}
                owners={owners}
                loading={loadingOwners}
              />
              {[
                { label: 'Make', key: 'make' },
                { label: 'Model', key: 'model' },
                { label: 'Year', key: 'year', numeric: true, maxLength: 4 },
                { label: 'Base Price (PKR)', key: 'basePrice', numeric: true, maxLength: 10 },
                { label: 'Auction End Date', key: 'auctionEnd', type: 'datetime-local' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} inputMode={f.numeric ? 'numeric' : undefined} pattern={f.numeric ? '[0-9]*' : undefined} maxLength={f.maxLength}
                    value={f.type === 'datetime-local' ? toLocalDateTime(editTarget[f.key]) : (editTarget[f.key] ?? '')}
                    onChange={e => setEditTarget(prev => ({ ...prev, [f.key]: f.numeric ? digitsOnly(e.target.value, f.maxLength) : e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
                </div>
              ))}
              <button onClick={saveEdit} className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-4">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {(results || resultsLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !resultsLoading && setResults(null)} />
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4"><div><h3 className="font-bold text-gray-900">Auction results</h3><p className="text-sm text-gray-500">{results ? `${results.auction.make} ${results.auction.model}` : 'Loading…'}</p></div><button disabled={resultsLoading} onClick={() => setResults(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
            {resultsLoading ? <p className="py-10 text-center text-sm text-gray-500">Loading bids…</p> : <><div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-gray-700"><p>Final bid: <strong>{formatPKR(results.auction.currentBid)}</strong></p><p className="mt-1">Winner: <strong>{results.winner?.name || (results.reserveMet ? 'No bids received' : 'Reserve not met — no winner')}</strong></p></div><div className="mt-5 space-y-2">{results.bids.length ? results.bids.map(bid => <div key={bid._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm"><span>{bid.bidderId?.name || 'Member'} <span className="text-gray-400">{bid.bidderId?.email || ''}</span></span><strong>{formatPKR(bid.amount)}</strong></div>) : <p className="py-6 text-center text-sm text-gray-500">No bids were placed for this auction.</p>}</div></>}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
