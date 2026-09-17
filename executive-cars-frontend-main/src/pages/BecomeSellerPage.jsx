import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ClipboardCheck, FileText, CheckCircle, Upload, ChevronRight, X, RefreshCw } from 'lucide-react'
import SellerLayout from '../components/SellerLayout.jsx'
import api from '../api/api.js'
import { useAuth } from '../context/authContext.js'
import {
  digitsOnly,
  isValidCnic,
  isValidPersonName,
  isValidPhone,
  sanitizeCnic,
  sanitizePersonName,
  sanitizePhone,
} from '../utils/inputValidation.js'

const steps = [
  { icon: ClipboardCheck, label: 'Fill Form', desc: 'Provide your personal and car details' },
  { icon: FileText, label: 'Documents', desc: 'Upload CNIC and vehicle registration' },
  { icon: CheckCircle, label: 'Admin Approval', desc: 'Our team reviews and confirms your slot' },
]
const branches = ['Rawalpindi - Stadium Road Branch', 'Rawalpindi - Saddar Branch']

export default function BecomeSellerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const flowSteps = steps
  const [step, setStep] = useState(1)
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(60)
  const [otpError, setOtpError] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: sanitizePersonName(user?.name || ''), phone: sanitizePhone(user?.phone || ''), cnic: '', email: user?.email || '', make: '', model: '', year: '', mileage: '', engine: '', cnicFile: null, regFile: null, date: '', time: '', branch: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

  useEffect(() => {
    if (!showOTP || otpTimer <= 0) return undefined
    const timer = setTimeout(() => setOtpTimer(value => Math.max(0, value - 1)), 1000)
    return () => clearTimeout(timer)
  }, [showOTP, otpTimer])

  const startOtpTimer = () => {
    setOtpTimer(60)
  }

  const handleResendOtp = async () => {
    try {
      const { data } = await api.post('/bookings/send-otp', { email: form.email })
      setDevOtp(data.devOtp || '')
      startOtpTimer()
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.')
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    if (!/^\d{6}$/.test(otp.join(''))) {
      setOtpError('Enter the complete 6-digit OTP.')
      return
    }
    setVerifying(true)
    try {
      await api.post('/bookings/verify-otp', { email: form.email, otp: otp.join('') })
      setDevOtp('')
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('cnic', form.cnic)
      fd.append('email', form.email)
      fd.append('carMake', form.make)
      fd.append('carModel', form.model)
      fd.append('carYear', form.year)
      fd.append('mileage', form.mileage)
      fd.append('engineCC', form.engine)
      fd.append('date', form.date)
      fd.append('time', form.time)
      fd.append('branch', form.branch)
      if (form.cnicFile) fd.append('cnicImage', form.cnicFile)
      if (form.regFile) fd.append('regDoc', form.regFile)
      setSubmitting(true)
      await api.post('/bookings', fd)
      setShowOTP(false)
      navigate('/seller/bookings', {
        state: {
          date: form.date,
          time: form.time,
          branch: form.branch,
          email: form.email,
          bookingCreated: true,
        },
      })
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP.')
    }
    setVerifying(false)
    setSubmitting(false)
  }

  const validateStep = (stepNum) => {
    const e = {}
    if (stepNum === 1) {
      if (!isValidPersonName(form.name)) e.name = 'Enter a valid full name using letters only.'
      if (!isValidPhone(form.phone)) e.phone = 'Enter a valid phone number with 10 to 15 digits.'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
      if (!isValidCnic(form.cnic)) e.cnic = 'Enter a valid 13-digit CNIC.'
    }
    if (stepNum === 2) {
      if (!form.make.trim()) e.make = 'Car make is required.'
      if (!form.model.trim()) e.model = 'Car model is required.'
      const year = Number(form.year)
      if (!year || year < 1900 || year > new Date().getFullYear() + 1) e.year = 'Enter a valid model year.'
      if (!Number.isFinite(Number(form.mileage)) || Number(form.mileage) < 0 || form.mileage === '') e.mileage = 'Enter valid mileage.'
      if (!Number(form.engine) || Number(form.engine) < 1) e.engine = 'Enter valid engine capacity.'
    }
    if (stepNum === 3) {
      if (!form.date) e.date = 'Inspection date is required.'
      else if (form.date < today) e.date = 'Inspection date cannot be in the past.'
      if (!form.time) e.time = 'Please select a preferred time.'
      if (!form.branch) e.branch = 'Please select a branch.'
    }
    return e
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateStep(step)
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    if (step < 3) { setStep(s => s + 1); return }
    if (requestingOtp) return
    setRequestingOtp(true)
    try {
      const { data } = await api.post('/bookings/send-otp', { email: form.email })
      setDevOtp(data.devOtp || '')
      setShowOTP(true)
      startOtpTimer()
    } catch (err) {
      setFieldErrors({ date: err.response?.data?.message || 'Failed to send OTP. Try again.' })
    } finally {
      setRequestingOtp(false)
    }
  }

  const page = (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 sm:p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Selling Tools</p>
              <h2 className="text-2xl font-black mt-1">Book a Vehicle Inspection</h2>
              <p className="text-blue-100 text-sm leading-6 mt-2 max-w-2xl">
                Choose a preferred date and branch. You can track the request from My Bookings without leaving the seller portal.
              </p>
            </div>
          </div>
        </section>

      {/* Main */}
      <section className="pb-2">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Timeline */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
              {flowSteps.map((s, i) => (
                <div key={s.label} className="flex gap-5 mb-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      step > i + 1 ? 'bg-blue-600' : step === i + 1 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100'
                    }`}>
                      <s.icon className={`w-6 h-6 ${step > i + 1 ? 'text-white' : step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    {i < flowSteps.length - 1 && <div className="w-px flex-1 bg-gray-200 my-2" />}
                  </div>
                  <div className="pb-8">
                    <h3 className={`font-bold mb-1 ${step === i + 1 ? 'text-blue-600' : 'text-gray-900'}`}>Step {i + 1}: {s.label}</h3>
                    <p className="text-gray-500 text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-2">
                <h4 className="text-gray-900 font-semibold mb-3">What to Expect</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Inspection appointment at the selected branch', 'Report can be attached after inspection', 'Listing remains pending until review', 'Email OTP confirms the booking address', 'Track approval status from your account'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
              <div className="mb-7">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Step {step} of 3</span>
                  <span>{Math.round((step / 3) * 100)}% Complete</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 && (
                  <>
                    <h3 className="text-gray-900 font-bold text-xl mb-5">Personal Information</h3>
                    {[
                      { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Muhammad Hasnain Ali', maxLength: 80 },
                      { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+923001234567', inputMode: 'tel', maxLength: 16 },
                      { label: 'CNIC Number', key: 'cnic', type: 'text', placeholder: '35202-1234567-1', inputMode: 'numeric', maxLength: 15 },
                      { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                        <input type={f.type} value={form[f.key]} onChange={e => update(f.key, f.key === 'name' ? sanitizePersonName(e.target.value) : f.key === 'phone' ? sanitizePhone(e.target.value) : f.key === 'cnic' ? sanitizeCnic(e.target.value) : e.target.value)} placeholder={f.placeholder} required readOnly={f.key === 'email' && user?.role === 'user'} inputMode={f.inputMode} maxLength={f.maxLength} className={`input-light ${fieldErrors[f.key] ? 'border-red-400' : ''} ${f.key === 'email' && user?.role === 'user' ? 'bg-gray-50 text-gray-500' : ''}`} />
                        {fieldErrors[f.key] && <p className="text-red-600 text-xs mt-1">{fieldErrors[f.key]}</p>}
                      </div>
                    ))}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="text-gray-900 font-bold text-xl mb-5">Vehicle & Price Details</h3>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
                      <span className="text-gray-600 text-sm">Not sure what your car is worth?</span>
                      <Link to="/price-predictor" className="text-blue-600 text-sm font-semibold hover:underline shrink-0">
                        Try Price Predictor →
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Car Make', key: 'make', placeholder: 'Toyota' },
                        { label: 'Model', key: 'model', placeholder: 'Corolla' },
                        { label: 'Year', key: 'year', placeholder: '2020', numeric: true, maxLength: 4 },
                        { label: 'Mileage (km)', key: 'mileage', placeholder: '45000', numeric: true, maxLength: 7 },
                      ].map(f => (
                        <div key={f.key}>
                          <label htmlFor={`seller-vehicle-${f.key}`} className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                          <input id={`seller-vehicle-${f.key}`} type="text" inputMode={f.numeric ? 'numeric' : undefined} pattern={f.numeric ? '[0-9]*' : undefined} maxLength={f.maxLength} value={form[f.key]} onChange={e => update(f.key, f.numeric ? digitsOnly(e.target.value, f.maxLength) : e.target.value)} placeholder={f.placeholder} required className={`input-light ${fieldErrors[f.key] ? 'border-red-400' : ''}`} />
                          {fieldErrors[f.key] && <p className="text-red-600 text-xs mt-1">{fieldErrors[f.key]}</p>}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label htmlFor="seller-vehicle-engine" className="block text-sm font-medium text-gray-700 mb-1.5">Engine CC</label>
                      <input id="seller-vehicle-engine" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={form.engine} onChange={e => update('engine', digitsOnly(e.target.value, 5))} placeholder="1800" required className={`input-light ${fieldErrors.engine ? 'border-red-400' : ''}`} />
                      {fieldErrors.engine && <p className="text-red-600 text-xs mt-1">{fieldErrors.engine}</p>}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="text-gray-900 font-bold text-xl mb-5">Documents & Verification</h3>
                    <div>
                      <p className="block text-sm font-medium text-gray-700 mb-1.5">Upload CNIC Image</p>
                      <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                        <span className="text-gray-500 text-sm">{form.cnicFile ? form.cnicFile.name : 'Drag & drop or click to upload CNIC'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => update('cnicFile', e.target.files[0])} />
                      </label>
                    </div>
                    <div>
                      <p className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Registration Document</p>
                      <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                        <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                        <span className="text-gray-500 text-sm">{form.regFile ? form.regFile.name : 'Drag & drop or click to upload Registration'}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => update('regFile', e.target.files[0])} />
                      </label>
                    </div>
                    <div>
                      <label htmlFor="seller-inspection-date" className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Inspection Date</label>
                      <input id="seller-inspection-date" type="date" min={today} value={form.date} onChange={e => update('date', e.target.value)} required className={`input-light ${fieldErrors.date ? 'border-red-400' : ''}`} />
                      {fieldErrors.date && <p className="text-red-600 text-xs mt-1">{fieldErrors.date}</p>}
                    </div>
                    <div>
                      <label htmlFor="seller-inspection-time" className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time</label>
                      <select id="seller-inspection-time" value={form.time} onChange={e => update('time', e.target.value)} required className={`input-light ${fieldErrors.time ? 'border-red-400' : ''}`}>
                        <option value="">Choose a time slot...</option>
                        <option value="10:00 AM - 12:00 PM">10:00 AM – 12:00 PM</option>
                        <option value="12:00 PM - 02:00 PM">12:00 PM – 02:00 PM</option>
                        <option value="02:00 PM - 04:00 PM">02:00 PM – 04:00 PM</option>
                        <option value="04:00 PM - 06:00 PM">04:00 PM – 06:00 PM</option>
                      </select>
                      {fieldErrors.time && <p className="text-red-600 text-xs mt-1">{fieldErrors.time}</p>}
                    </div>
                    <div>
                      <label htmlFor="seller-inspection-branch" className="block text-sm font-medium text-gray-700 mb-1.5">Select Branch</label>
                      <select id="seller-inspection-branch" value={form.branch} onChange={e => update('branch', e.target.value)} required className={`input-light ${fieldErrors.branch ? 'border-red-400' : ''}`}>
                        <option value="">Choose a verification branch...</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      {fieldErrors.branch && <p className="text-red-600 text-xs mt-1">{fieldErrors.branch}</p>}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost px-6 py-3 rounded-xl font-semibold text-sm">Back</button>
                  )}
                  <button type="submit" disabled={requestingOtp} className="btn-primary flex-1 py-3 rounded-xl font-semibold text-sm gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                    {step < 3
                      ? <>Next Step <ChevronRight className="w-4 h-4" /></>
                      : requestingOtp
                        ? 'Sending verification code…'
                        : <>Book Inspection <CheckCircle className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* OTP Modal */}
      {showOTP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close verification dialog" tabIndex={-1} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOTP(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="seller-otp-title" className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-scaleIn">
            <button type="button" aria-label="Close verification dialog" onClick={() => setShowOTP(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 id="seller-otp-title" className="text-gray-900 font-bold text-xl">Verify Your Email</h3>
              <p className="text-gray-500 text-sm mt-2">Enter the 6-digit OTP sent to {form.email}</p>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {otp.map((d, i) => (
                <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} value={d} onChange={e => handleOtpChange(i, e.target.value)}
                  className="w-11 h-12 bg-gray-50 border-2 border-gray-200 rounded-lg text-center text-gray-900 text-lg font-bold focus:outline-none focus:border-blue-500 transition-colors" />
              ))}
            </div>
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-center">
                <p className="text-amber-800 text-xs font-semibold">Local email delivery is unavailable</p>
                <p className="text-amber-950 font-black tracking-[0.25em] text-xl mt-1">{devOtp}</p>
                <p className="text-amber-700 text-[11px] mt-1">Development only — production never exposes the OTP.</p>
              </div>
            )}
            {otpError && <p className="text-red-600 text-xs text-center mb-3">{otpError}</p>}
            <button onClick={handleVerifyOtp} disabled={verifying || submitting} className="btn-primary w-full py-3 rounded-xl font-semibold text-sm mb-3">
              {verifying || submitting ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center text-sm text-gray-500">
              {otpTimer > 0 ? <span>Resend in {otpTimer}s</span> : (
                <button onClick={handleResendOtp} className="text-blue-600 flex items-center gap-1 mx-auto hover:underline">
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return <SellerLayout title="Book Inspection">{page}</SellerLayout>
}
