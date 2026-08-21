import React, { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminOwnerSelect, { ownerValue, useAdminOwners } from '../../components/AdminOwnerSelect.jsx'
import { formatPKR } from '../../utils/format.js'
import { digitsOnly } from '../../utils/inputValidation.js'
import api from '../../api/api.js'

export default function AdminUsedCarsListPage() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState(100000000)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [error, setError] = useState('')
  const { owners, loadingOwners } = useAdminOwners()

  useEffect(() => {
    api.get('/admin/products')
      .then(res => setCars(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load used cars.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = cars.filter(c => {
    const ownerText = `${c.ownerId?.name || ''} ${c.ownerId?.email || c.sellerEmail || ''}`
    const matchSearch = `${c.make} ${c.model} ${ownerText}`.toLowerCase().includes(search.toLowerCase())
    const matchPrice = c.price <= maxPrice
    return matchSearch && matchPrice
  })

  const confirmDelete = async () => {
    try {
      setError('')
      await api.delete(`/admin/products/${deleteTarget._id}`)
      setCars(prev => prev.filter(c => c._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete used car.')
    }
  }

  const saveEdit = async () => {
    try {
      setError('')
      const payload = {
        make: editTarget.make,
        model: editTarget.model,
        year: Number(editTarget.year),
        km: Number(editTarget.km),
        price: Number(editTarget.price),
        ownerId: ownerValue(editTarget.ownerId),
      }
      const { data } = await api.put(`/admin/products/${editTarget._id}`, payload)
      setCars(prev => prev.map(c => c._id === editTarget._id ? data : c))
      setEditTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update used car.')
    }
  }

  return (
    <AdminLayout title="Used Cars List">
      {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search car..."
              className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-52" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm whitespace-nowrap">Max Price:</span>
            <input type="range" min={500000} max={100000000} step={500000}
              value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="w-28 accent-blue-600" />
            <span className="text-blue-600 text-sm font-medium whitespace-nowrap">{formatPKR(maxPrice)}</span>
          </div>
        </div>
        <Link to="/admin/upload-used-car" className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add New Used Car
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading used cars...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Car', 'Owner', 'Year', 'Mileage', 'Price', 'Date Listed', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-gray-500 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No cars found.</p>
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-black text-sm">{c.make?.[0]}</div>
                        <span className="text-gray-900 font-medium text-sm">{c.make} {c.model}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-700 text-sm font-medium">{c.ownerId?.name || 'Executive Cars'}</p>
                      <p className="text-gray-400 text-xs">{c.ownerId?.email || c.sellerEmail || 'Showroom owned'}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-sm">{c.year}</td>
                    <td className="px-4 py-4 text-gray-500 text-sm">{c.km?.toLocaleString()} km</td>
                    <td className="px-4 py-4 text-blue-600 font-bold text-sm">PKR {formatPKR(c.price)}</td>
                    <td className="px-4 py-4 text-gray-500 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditTarget(c)} className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 flex items-center justify-center transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <h3 className="text-gray-900 font-bold text-xl mb-2">Delete Car?</h3>
            <p className="text-gray-500 text-sm mb-6">Remove <span className="text-gray-900 font-medium">{deleteTarget.make} {deleteTarget.model}</span> from used cars?</p>
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
              <h3 className="text-gray-900 font-bold text-lg">Edit Used Car</h3>
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
                { label: 'Mileage (km)', key: 'km', numeric: true, maxLength: 7 },
                { label: 'Price (PKR)', key: 'price', numeric: true, maxLength: 10 },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">{f.label}</label>
                  <input type="text" inputMode={f.numeric ? 'numeric' : undefined} pattern={f.numeric ? '[0-9]*' : undefined} maxLength={f.maxLength} value={editTarget[f.key] ?? ''}
                    onChange={e => setEditTarget(prev => ({ ...prev, [f.key]: f.numeric ? digitsOnly(e.target.value, f.maxLength) : e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
                </div>
              ))}
              <button onClick={saveEdit} className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-4">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
