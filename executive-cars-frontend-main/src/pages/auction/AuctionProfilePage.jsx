import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Calendar, Shield, Edit3, Save, X, Key, CheckCircle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AuctionLayout from '../../components/AuctionLayout.jsx'
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

export default function AuctionProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    cnic: '',
    city: '',
  })
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [showPassSection, setShowPassSection] = useState(false)
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    api.get('/member/profile').then(res => {
      const p = res.data
      setProfile(p)
      setForm({ name: sanitizePersonName(p.name), email: p.email, phone: sanitizePhone(p.phone || ''), cnic: sanitizeCnic(p.cnic || ''), city: p.city || '' })
    }).catch(err => setProfileError(err.response?.data?.message || 'Could not load your profile.'))
  }, [])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!isValidPersonName(form.name)) {
      setProfileError('Enter a valid full name using letters only.')
      return
    }
    if (form.phone && !isValidPhone(form.phone)) {
      setProfileError('Enter a valid phone number with 10 to 15 digits.')
      return
    }
    if (form.cnic && !isValidCnic(form.cnic)) {
      setProfileError('Enter a valid 13-digit CNIC.')
      return
    }
    try {
      setProfileError('')
      await api.put('/member/profile', { name: form.name, phone: form.phone, cnic: form.cnic, city: form.city })
      updateUser({ name: form.name })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not update your profile.')
    }
  }

  const handleChangePassword = async () => {
    setPassError('')
    if (passForm.newPass !== passForm.confirm) { setPassError('Passwords do not match.'); return }
    try {
      await api.post('/auth/change-password', { current: passForm.current, newPassword: passForm.newPass })
      setPassSaved(true)
      setPassForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setPassSaved(false), 3000)
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password.')
    }
  }

  const handleLogout = () => { logout(); navigate('/auction') }

  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'
  const memberExpiry = profile?.subscriptionExpiry ? new Date(profile.subscriptionExpiry).toLocaleDateString() : '—'
  const daysLeft = profile?.subscriptionExpiry ? Math.max(0, Math.ceil((new Date(profile.subscriptionExpiry) - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  const memberId = profile?._id ? 'EC-' + profile._id.toString().slice(-8).toUpperCase() : '—'

  return (
    <AuctionLayout title="My Profile">
      <div className="max-w-2xl">
        {profileError && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{profileError}</div>}
        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-24 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">
                  {(form.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-4 flex gap-2">
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave}
                    className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-blue-50 transition-colors">
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-14 px-6 pb-6">
            {saved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Profile updated successfully!
              </div>
            )}

            <div className="mb-4">
              {editing ? (
                <input value={form.name} onChange={e => update('name', sanitizePersonName(e.target.value))}
                  maxLength={80} autoComplete="name" className="input-light text-xl font-black w-full mb-1" />
              ) : (
                <h2 className="text-gray-900 font-black text-xl">{form.name}</h2>
              )}
              <p className="text-blue-600 text-sm font-medium">Executive Member</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Mail,     label: 'Email',   key: 'email',  type: 'email' },
                { icon: Phone,    label: 'Phone',   key: 'phone',  type: 'tel'   },
                { icon: Shield,   label: 'CNIC',    key: 'cnic',   type: 'text'  },
                { icon: User,     label: 'City',    key: 'city',   type: 'text'  },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <f.icon className="w-3 h-3" /> {f.label}
                  </label>
                  {editing ? (
                    <input type={f.type} value={form[f.key]} onChange={e => update(f.key, f.key === 'phone' ? sanitizePhone(e.target.value) : f.key === 'cnic' ? sanitizeCnic(e.target.value) : e.target.value)} disabled={f.key === 'email'}
                      inputMode={f.key === 'phone' ? 'tel' : f.key === 'cnic' ? 'numeric' : undefined}
                      pattern={f.key === 'cnic' ? '[0-9-]*' : undefined}
                      maxLength={f.key === 'phone' ? 16 : f.key === 'cnic' ? 15 : undefined}
                      className="input-light text-sm disabled:bg-gray-50 disabled:text-gray-500" />
                  ) : (
                    <p className="text-gray-900 font-medium text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      {form[f.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Membership card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-200" />
              <span className="font-bold text-sm uppercase tracking-wider text-blue-100">Executive Membership</span>
            </div>
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">Active</span>
          </div>
          <p className="text-white font-black text-2xl font-mono mb-1">{memberId}</p>
          <div className="flex items-center justify-between mt-3 text-blue-100 text-sm">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Since {memberSince}</span>
            <span>Expires {memberExpiry}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs">Days Remaining</p>
              <p className="text-white font-black text-3xl">{daysLeft}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
          <button
            onClick={() => setShowPassSection(!showPassSection)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <Key className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-gray-900 font-semibold">Change Password</span>
            </div>
            <span className="text-gray-400 text-sm">{showPassSection ? '▲' : '▼'}</span>
          </button>

          {showPassSection && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
              {[
                { label: 'Current Password', key: 'current' },
                { label: 'New Password',     key: 'newPass' },
                { label: 'Confirm Password', key: 'confirm' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="password" value={passForm[f.key]}
                    onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input-light" placeholder="••••••••" />
                </div>
              ))}
              {passError && <p className="text-red-600 text-xs">{passError}</p>}
              {passSaved && <p className="text-green-600 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Password updated!</p>}
              <button onClick={handleChangePassword} className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm">
                Update Password
              </button>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
            <LogOut className="w-4 h-4 text-red-500" /> Account Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleLogout}
              className="bg-red-50 border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </AuctionLayout>
  )
}
