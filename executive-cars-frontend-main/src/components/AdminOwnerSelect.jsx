import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import api from '../api/api.js'

export function useAdminOwners() {
  const [owners, setOwners] = useState([])
  const [loadingOwners, setLoadingOwners] = useState(true)

  useEffect(() => {
    let active = true
    api.get('/admin/members', { params: { page: 1, limit: 200 } })
      .then(({ data }) => {
        if (active) setOwners(Array.isArray(data.members) ? data.members : [])
      })
      .catch(() => { if (active) setOwners([]) })
      .finally(() => { if (active) setLoadingOwners(false) })
    return () => { active = false }
  }, [])

  return { owners, loadingOwners }
}

export function ownerValue(ownerId) {
  if (!ownerId) return ''
  return typeof ownerId === 'object' ? ownerId._id || '' : ownerId
}

export default function AdminOwnerSelect({ value, onChange, owners, loading = false }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 font-medium mb-1.5">Listing Owner</label>
      <div className="relative">
        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <select
          value={ownerValue(value)}
          onChange={event => onChange(event.target.value)}
          disabled={loading}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-60"
        >
          <option value="">Executive Cars — showroom owned</option>
          {owners.map(owner => (
            <option key={owner._id} value={owner._id}>
              {owner.name} — {owner.email}{owner.sellerApproved ? ' (verified seller)' : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">Select a customer to make this listing appear in that account’s seller dashboard.</p>
    </div>
  )
}
