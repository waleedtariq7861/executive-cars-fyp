import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, FileText, CheckCircle, Gavel, ChevronDown } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminOwnerSelect, { useAdminOwners } from '../../components/AdminOwnerSelect.jsx'
import { BRANDS, MODELS } from '../../data/carBrands.js'
import api from '../../api/api.js'
import { digitsOnly } from '../../utils/inputValidation.js'
const colors = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Brown', 'Green', 'Orange']

export default function AdminUploadAuctionPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    make: '', model: '', year: '', mileage: '', engine: '',
    transmission: 'Auto', fuel: 'Petrol', color: '',
    basePrice: '', startDate: '', endDate: '', notes: '', ownerId: '',
  })
  const [images, setImages] = useState([])
  const [report, setReport] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [errors, setErrors] = useState({})
  const { owners, loadingOwners } = useAdminOwners()

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.make) e.make = 'Brand is required.'
    if (!form.model) e.model = 'Model is required.'
    const yr = Number(form.year)
    if (!form.year || yr < 1990 || yr > new Date().getFullYear() + 1) e.year = 'Enter a valid year (1990–present).'
    const mi = Number(form.mileage)
    if (!form.mileage || mi < 0) e.mileage = 'Mileage must be a positive number.'
    const eng = Number(form.engine)
    if (!form.engine || eng < 600 || eng > 8000) e.engine = 'Engine CC must be between 600 and 8000.'
    const bp = Number(form.basePrice)
    if (!form.basePrice || bp <= 0) e.basePrice = 'Base price must be a positive number.'
    if (!form.startDate) e.startDate = 'Start date is required.'
    if (!form.endDate) e.endDate = 'End date is required.'
    if (form.startDate && Number.isNaN(new Date(form.startDate).getTime())) e.startDate = 'Enter a valid start date.'
    if (form.endDate && Number.isNaN(new Date(form.endDate).getTime())) e.endDate = 'Enter a valid end date.'
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      e.endDate = 'End date must be after the start date.'
    }
    return e
  }

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files].slice(0, 6))
  }

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('make', form.make)
      fd.append('model', form.model)
      fd.append('year', form.year)
      fd.append('km', form.mileage)
      fd.append('engine', form.engine)
      fd.append('transmission', form.transmission)
      fd.append('fuel', form.fuel)
      fd.append('color', form.color)
      fd.append('basePrice', form.basePrice)
      fd.append('auctionStart', new Date(form.startDate).toISOString())
      fd.append('auctionEnd', new Date(form.endDate).toISOString())
      fd.append('description', form.notes)
      fd.append('ownerId', form.ownerId)
      images.forEach(img => fd.append('images', img))
      if (report) fd.append('report', report)
      await api.post('/admin/cars', fd)
      setSaved(true)
      setForm({ make: '', model: '', year: '', mileage: '', engine: '', transmission: 'Auto', fuel: 'Petrol', color: '', basePrice: '', startDate: '', endDate: '', notes: '', ownerId: '' })
      setImages([])
      setReport(null)
      setResetKey(k => k + 1)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to list car. Try again.' })
    }
    setSaving(false)
  }

  return (
    <AdminLayout title="Upload Car to Auction">
      <form onSubmit={handleSubmit}>
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Car listed on auction platform!</p>
              <p className="text-xs text-green-600 mt-0.5">Fill the form again to list another car.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-5 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" /> Vehicle Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Make */}
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Car Make</label>
                  <div className="relative">
                    <select
                      value={form.make}
                      onChange={e => { update('make', e.target.value); update('model', '') }}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm appearance-none"
                    >
                      <option value="">Select Make</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                {/* Model */}
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Model</label>
                  <div className="relative">
                    <select
                      value={form.model}
                      onChange={e => update('model', e.target.value)}
                      required
                      disabled={!form.make}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm appearance-none disabled:opacity-40"
                    >
                      <option value="">Select Model</option>
                      {(MODELS[form.make] || []).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                {/* Year */}
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Year</label>
                  <select
                    value={form.year}
                    onChange={e => update('year', e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {/* Mileage */}
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Mileage (km)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    value={form.mileage}
                    onChange={e => update('mileage', digitsOnly(e.target.value, 7))}
                    placeholder="45000"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  {errors.mileage && <p className="text-red-600 text-xs mt-1">{errors.mileage}</p>}
                </div>
                {/* Engine */}
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Engine CC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    value={form.engine}
                    onChange={e => update('engine', digitsOnly(e.target.value, 5))}
                    placeholder="1800"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  {errors.engine && <p className="text-red-600 text-xs mt-1">{errors.engine}</p>}
                </div>
                {/* Color */}
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Color</label>
                  <div className="relative">
                    <select
                      value={form.color}
                      onChange={e => update('color', e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm appearance-none"
                    >
                      <option value="">Select Color</option>
                      {colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Transmission */}
              <div className="mt-4">
                <label className="block text-sm text-gray-600 font-medium mb-2">Transmission</label>
                <div className="flex gap-2">
                  {['Auto', 'Manual'].map(t => (
                    <button key={t} type="button" onClick={() => update('transmission', t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.transmission === t ? 'btn-primary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuel */}
              <div className="mt-4">
                <label className="block text-sm text-gray-600 font-medium mb-2">Fuel Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Petrol', 'Diesel', 'CNG', 'Hybrid'].map(f => (
                    <button key={f} type="button" onClick={() => update('fuel', f)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${form.fuel === f ? 'btn-primary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auction Settings */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-5">Auction Settings</h3>
              <div className="space-y-4">
                <AdminOwnerSelect value={form.ownerId} onChange={value => update('ownerId', value)} owners={owners} loading={loadingOwners} />
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Base Price (PKR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={form.basePrice}
                    onChange={e => update('basePrice', digitsOnly(e.target.value, 10))}
                    placeholder="5000000"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  {errors.basePrice && <p className="text-red-600 text-xs mt-1">{errors.basePrice}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 font-medium mb-1.5">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={e => update('startDate', e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    {errors.startDate && <p className="text-red-600 text-xs mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 font-medium mb-1.5">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={e => update('endDate', e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    {errors.endDate && <p className="text-red-600 text-xs mt-1">{errors.endDate}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">Notes / Description</label>
                  <textarea
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    rows={3}
                    placeholder="Additional details about the car..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Image Upload */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-5">Car Images</h3>
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors group mb-4">
                <Upload className="w-10 h-10 text-gray-500 group-hover:text-primary mx-auto mb-3 transition-colors" />
                <p className="text-gray-500 text-sm">Drag & drop images or click to upload</p>
                <p className="text-gray-600 text-xs mt-1">Max 6 images, JPG/PNG</p>
                <input key={resetKey} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden group">
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs p-2 text-center">
                        {img.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inspection Report */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-gray-900 font-bold mb-5">Inspection Report</h3>
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors group">
                <FileText className="w-8 h-8 text-gray-500 group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-gray-500 text-sm">
                  {report ? report.name : 'Upload inspection report PDF'}
                </p>
                <input key={`pdf-${resetKey}`} type="file" accept=".pdf" className="hidden" onChange={e => setReport(e.target.files[0])} />
              </label>
            </div>

            {/* Submit */}
            {errors.submit && <p className="text-red-600 text-sm text-center">{errors.submit}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-ghost flex-1 py-3.5 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || saved}
                className="btn-primary flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                {saved ? (
                  <><CheckCircle className="w-4 h-4" /> Listed!</>
                ) : saving ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Listing...</>
                ) : (
                  <><Gavel className="w-4 h-4" /> List on Auction Platform</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}
