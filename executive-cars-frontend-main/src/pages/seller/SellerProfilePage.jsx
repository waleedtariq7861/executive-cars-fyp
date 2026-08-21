import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react'
import SellerLayout from '../../components/SellerLayout.jsx'
import { useAuth } from '../../context/authContext.js'
import api from '../../api/api.js'
import {
  isValidCnic,
  isValidPersonName,
  isValidPhone,
  sanitizeCnic,
  sanitizePersonName,
  sanitizePhone,
} from '../../utils/inputValidation.js'

export default function SellerProfilePage() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: user?.name || '', phone: '', cnic: '', address: '' })

  useEffect(() => {
    api.get('/seller/profile').then(res => {
      const p = res.data
      setForm({ name: sanitizePersonName(p.name), phone: sanitizePhone(p.phone || ''), cnic: sanitizeCnic(p.cnic || ''), address: p.address || '' })
    }).catch(err => setError(err.response?.data?.message || 'Could not load your profile.'))
  }, [])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!isValidPersonName(form.name)) return setError('Enter a valid full name using letters only.')
    if (form.phone && !isValidPhone(form.phone)) return setError('Enter a valid phone number with 10 to 15 digits.')
    if (form.cnic && !isValidCnic(form.cnic)) return setError('Enter a valid 13-digit CNIC.')
    try {
      setError('')
      await api.put('/seller/profile', { name: form.name, phone: form.phone, cnic: form.cnic, address: form.address })
      updateUser({ name: form.name })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your profile.')
    }
  }

  return (
    <SellerLayout title="My Profile">
      {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}
      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-3">
          <Save className="w-5 h-5 shrink-0" />
          <p className="font-semibold text-sm">Profile updated successfully!</p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900 font-bold text-lg">Profile Information</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-ghost px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost px-4 py-2 rounded-xl text-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xl shrink-0">
              {(form.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{form.name}</p>
              <p className="text-blue-600 text-sm font-medium">Verified Seller</p>
              <p className="text-gray-400 text-xs">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'name',    label: 'Full Name',    icon: User,   type: 'text' },
              { key: 'phone',   label: 'Phone Number', icon: Phone,  type: 'tel'  },
              { key: 'cnic',    label: 'CNIC',         icon: User,   type: 'text' },
              { key: 'address', label: 'Address',      icon: MapPin, type: 'text' },
            ].map(({ key, label, icon: Icon, type }) => (
              <div key={key}>
                <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={type} value={form[key]} disabled={!editing}
                    onChange={e => update(key, key === 'name' ? sanitizePersonName(e.target.value) : key === 'phone' ? sanitizePhone(e.target.value) : key === 'cnic' ? sanitizeCnic(e.target.value) : e.target.value)}
                    inputMode={key === 'phone' ? 'tel' : key === 'cnic' ? 'numeric' : undefined}
                    pattern={key === 'cnic' ? '[0-9-]*' : undefined}
                    maxLength={key === 'name' ? 80 : key === 'phone' ? 16 : key === 'cnic' ? 15 : undefined}
                    className="input-light pl-10 w-full disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={user?.email || ''} disabled
                  className="input-light pl-10 w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <p className="text-gray-400 text-xs mt-1">Email cannot be changed here.</p>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  )
}
