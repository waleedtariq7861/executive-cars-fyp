import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Calendar, CheckCircle2, ClipboardCheck, FileText, Fuel, Gauge, Heart,
  Mail, MapPin, MessageSquare, Phone, Settings, Share2, ShieldCheck, Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { formatPKR } from '../utils/format.js'
import api from '../api/api.js'
import { siteConfig } from '../config/site.js'
import VehicleImage from '../components/VehicleImage.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import { useToast } from '../context/toastContext.js'

export default function UsedCarDetailPage() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [similarCars, setSimilarCars] = useState([])

  useEffect(() => {
    let active = true
    setActiveImg(0)
    setLoadError('')
    api.get(`/products/${id}`)
      .then(response => { if (active) setCar(response.data) })
      .catch(error => { if (active) { setCar(null); setLoadError(error.response?.data?.message || 'Car details could not be loaded.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!car?.make) return undefined
    let active = true
    api.get('/products', { params: { make: car.make } }).then(response => { if (active) setSimilarCars((Array.isArray(response.data) ? response.data : []).filter(item => item._id !== car._id).slice(0, 3)) }).catch(() => { if (active) setSimilarCars([]) })
    return () => { active = false }
  }, [car])

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem('ec_wishlist') || '[]').includes(id)) } catch { setSaved(false) }
  }, [id])

  const images = useMemo(() => car?.images?.filter(Boolean) || [], [car])

  if (loading) return <PageState><div className="text-center"><div className="w-10 h-10 border-4 border-blue-100 border-t-blue-700 rounded-full animate-spin mx-auto" /><p className="text-sm text-gray-500 mt-4">Loading car details…</p></div></PageState>

  if (!car) return (
    <PageState>
      <div className="text-center max-w-sm"><div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6 text-gray-400" /></div><h1 className="text-xl font-black text-gray-900 mt-4">Car details unavailable</h1><p className="text-sm text-gray-500 mt-2">{loadError || 'This listing may have been removed or is no longer available.'}</p><Link to="/used-cars" className="btn-brand px-5 py-2.5 text-sm mt-5">Back to used cars</Link></div>
    </PageState>
  )

  const engine = String(car.engine || '').toLowerCase().includes('cc') ? car.engine : car.engine ? `${car.engine} cc` : '—'
  const sellerEmail = car.sellerEmail || siteConfig.email
  const verified = car.verificationStatus === 'verified'
  const hasReport = car.inspectionStatus === 'report_available' || Boolean(car.pdfUrl)
  const specs = [
    { icon: Calendar, label: 'Model year', value: car.year },
    { icon: Gauge, label: 'Mileage', value: `${Number(car.km || 0).toLocaleString()} km` },
    { icon: Fuel, label: 'Fuel type', value: car.fuel || '—' },
    { icon: Settings, label: 'Transmission', value: car.transmission || '—' },
  ]
  const toggleSaved = () => {
    let ids = []
    try { ids = JSON.parse(localStorage.getItem('ec_wishlist') || '[]') } catch { ids = [] }
    const nextSaved = !saved
    const next = nextSaved ? [...new Set([...ids, id])] : ids.filter(item => item !== id)
    localStorage.setItem('ec_wishlist', JSON.stringify(next))
    setSaved(nextSaved)
    showToast({ tone: 'success', title: nextSaved ? 'Car saved' : 'Car removed', message: nextSaved ? 'Added to your browser shortlist.' : 'Removed from your browser shortlist.' })
  }
  const share = async () => {
    const data = { title: `${car.make} ${car.model} ${car.year}`, text: `View this ${car.make} ${car.model} on Executive Cars`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(window.location.href); showToast({ tone: 'success', title: 'Link copied', message: 'The listing link is ready to share.' }) }
    } catch (error) {
      if (error.name !== 'AbortError') showToast({ tone: 'error', title: 'Could not share', message: 'Copy the page address from your browser instead.' })
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <Navbar />
      <div className="pt-[68px] md:pt-[100px]">
        <div className="bg-white border-b border-gray-200">
          <div className="market-shell py-4">
            <nav className="flex items-center gap-2 text-xs text-gray-400"><Link to="/" className="hover:text-blue-700">Home</Link><span>/</span><Link to="/used-cars" className="hover:text-blue-700">Used Cars</Link><span>/</span><span className="truncate">{car.make} {car.model}</span></nav>
          </div>
        </div>

        <main className="market-shell py-6 lg:py-8">
          <Link to="/used-cars" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 mb-5"><ArrowLeft className="w-4 h-4" /> Back to listings</Link>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">{hasReport && <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 rounded px-2 py-1 text-[10px] font-bold"><CheckCircle2 className="w-3 h-3" /> INSPECTION REPORT AVAILABLE</span>}{verified && <span className="bg-blue-50 border border-blue-100 text-blue-700 rounded px-2 py-1 text-[10px] font-bold">VERIFIED LISTING</span>}{!verified && !hasReport && <span className="bg-gray-100 border border-gray-200 text-gray-600 rounded px-2 py-1 text-[10px] font-bold">STATUS NOT RECORDED</span>}</div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{car.make} {car.model} {car.year}</h1>
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2"><MapPin className="w-4 h-4 text-blue-500" /> {car.city || 'Location not provided'}</p>
            </div>
            <div className="lg:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Asking price</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">PKR {formatPKR(car.price)}</p>
              <p className="text-xs text-gray-400 mt-1">Price is subject to seller confirmation</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-card">
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                  <VehicleImage src={images[activeImg]} alt={`${car.make} ${car.model} view ${activeImg + 1}`} className="w-full h-full object-cover" fallbackClassName="w-full h-full" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button type="button" onClick={toggleSaved} className="w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center" aria-label={saved ? 'Remove from saved cars' : 'Save car'}><Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} /></button>
                    <button type="button" onClick={share} className="w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center" aria-label="Share listing"><Share2 className="w-4 h-4 text-gray-600" /></button>
                  </div>
                </div>
                {images.length > 1 && <div className="flex gap-2 p-3 overflow-x-auto">{images.map((image, index) => <button type="button" key={image} onClick={() => setActiveImg(index)} aria-label={`View image ${index + 1}`} className={`w-20 h-14 rounded-md overflow-hidden border-2 shrink-0 ${activeImg === index ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}><VehicleImage src={image} alt="" className="w-full h-full object-cover" fallbackClassName="w-full h-full" /></button>)}</div>}
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-card">
                <h2 className="text-lg font-black text-gray-900 mb-5">Key details</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {specs.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-4"><Icon className="w-5 h-5 text-blue-700" /><p className="text-[10px] uppercase tracking-wide font-bold text-gray-400 mt-3">{label}</p><p className="text-sm font-bold text-gray-900 mt-1">{value}</p></div>)}
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-card">
                <div className="flex items-center justify-between gap-4 mb-5"><h2 className="text-lg font-black text-gray-900">Vehicle specifications</h2><span className="text-xs text-gray-400">Listing ID: {String(car._id || id).slice(-8)}</span></div>
                <div className="grid sm:grid-cols-2 gap-x-8">
                  {[
                    ['Make', car.make], ['Model', car.model], ['Model Year', car.year], ['Engine', engine],
                    ['Exterior Color', car.color || '—'], ['Fuel Type', car.fuel || '—'], ['Transmission', car.transmission || '—'], ['Mileage', `${Number(car.km || 0).toLocaleString()} km`],
                  ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 text-sm"><span className="text-gray-500">{label}</span><span className="font-semibold text-gray-900 text-right">{value}</span></div>)}
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-card">
                <h2 className="text-lg font-black text-gray-900">Seller comments</h2>
                <p className="text-sm text-gray-600 leading-7 mt-3">{car.description || 'Contact the listing representative for current availability, condition details, documents, and a viewing schedule.'}</p>
              </section>

              <section className="bg-[#0f172a] text-white rounded-xl p-5 sm:p-6">
                <div className="flex items-start gap-4"><div className="w-11 h-11 rounded-lg bg-green-500/15 border border-green-400/20 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-green-400" /></div><div><h2 className="font-black">Buy with due diligence</h2><p className="text-sm text-blue-100/65 leading-6 mt-1">Inspect the vehicle, verify original documents and ownership, and confirm the seller before making payment.</p><div className="flex flex-wrap gap-4 mt-4 text-xs font-semibold text-blue-100/80">{verified && <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Listing verified</span>}{hasReport && <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Report available</span>}</div></div></div>
              </section>

              {similarCars.length > 0 && <section><div className="flex items-center justify-between gap-4 mb-4"><h2 className="text-xl font-black text-gray-900">Similar cars</h2><Link to={`/used-cars?search=${encodeURIComponent(car.make)}`} className="text-sm font-bold text-blue-700">View more</Link></div><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{similarCars.map(item => <VehicleCard key={item._id} car={item} compact />)}</div></section>}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-[116px]">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-card">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100"><div className="w-11 h-11 bg-blue-800 rounded-full flex items-center justify-center text-white font-black">EC</div><div><p className="font-bold text-gray-900">Executive Cars</p><p className="text-xs text-gray-500 mt-0.5">Marketplace contact</p></div></div>
                <p className="text-sm text-gray-500 leading-6 my-4">Ask about availability, the inspection report, or book a showroom viewing.</p>
                <div className="space-y-2.5">
                  {siteConfig.phone && <a href={`tel:${siteConfig.phone}`} className="btn-primary w-full py-3 text-sm gap-2"><Phone className="w-4 h-4" /> Call {siteConfig.phoneLabel || siteConfig.phone}</a>}
                  <a href={`mailto:${sellerEmail}?subject=${encodeURIComponent(`${car.make} ${car.model} ${car.year} enquiry`)}`} className="btn-brand w-full py-3 text-sm gap-2"><MessageSquare className="w-4 h-4" /> Message showroom</a>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-4"><Mail className="w-3.5 h-3.5" /> {sellerEmail}</p>
                <Link to="/seller/book-inspection" className="btn-ghost w-full py-3 text-sm gap-2 mt-3"><ClipboardCheck className="w-4 h-4" /> Book inspection</Link>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5"><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-700" /><h3 className="font-bold text-blue-950">Price insight</h3></div><p className="text-xs text-blue-900/70 leading-5 mt-2">Compare this asking price with a data-assisted valuation using your own vehicle details.</p><Link to="/price-predictor" className="btn-primary w-full py-2.5 text-xs mt-4">Open price predictor</Link></div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-card">
                <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-700" /><h3 className="font-bold text-gray-900">Inspection report</h3></div>
                <p className="text-xs text-gray-500 leading-5 mt-2">{car.pdfUrl ? 'A report file is attached to this listing.' : 'No inspection report is attached to this listing.'}</p>
                {car.pdfUrl ? <a href={car.pdfUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full py-2.5 text-xs mt-4">View report</a> : <a href={`mailto:${sellerEmail}?subject=Inspection report enquiry`} className="btn-ghost w-full py-2.5 text-xs mt-4">Ask about inspection</a>}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="text-sm font-bold text-amber-900">Safety reminder</p><p className="text-xs text-amber-800/75 leading-5 mt-1">Never send advance payment before inspecting the car and verifying its documents.</p></div></div></div>
            </aside>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

function PageState({ children }) {
  return <div className="min-h-screen bg-[#f5f7f9] flex flex-col"><Navbar /><main className="flex-1 pt-[68px] md:pt-[100px] flex items-center justify-center px-4">{children}</main><Footer /></div>
}
