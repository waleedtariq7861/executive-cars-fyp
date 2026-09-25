import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Brain, Calculator, Car, CheckCircle2,
  ChevronRight, ClipboardCheck, Gavel, Search,
  ShieldCheck, Sparkles, TrendingUp,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx'
import { SectionHeading } from '../components/ui/Display.jsx'
import { siteConfig } from '../config/site.js'
import api from '../api/api.js'
import hero640Avif from '../assets/executive-cars-hero-640.avif'
import hero1280Avif from '../assets/executive-cars-hero-1280.avif'
import hero1746Avif from '../assets/executive-cars-hero-1746.avif'
import hero640Webp from '../assets/executive-cars-hero-640.webp'
import hero1280Webp from '../assets/executive-cars-hero-1280.webp'
import hero1746Webp from '../assets/executive-cars-hero-1746.webp'
import { hasInspectionReport } from '../utils/inspectionReport.js'

const makes = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'BMW']
const models = ['Corolla', 'Civic', 'City', 'Alto', 'Cultus', 'Sportage', 'Tucson', 'Yaris']
const cities = ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Faisalabad', 'Peshawar']
const budgets = [
  { label: 'Under PKR 2,000,000', value: 2000000 }, { label: 'Under PKR 4,000,000', value: 4000000 },
  { label: 'Under PKR 7,000,000', value: 7000000 }, { label: 'Under PKR 10,000,000', value: 10000000 },
]
const trustItems = [
  { icon: Car, title: 'Used-car marketplace', text: 'Browse vehicles across popular makes and cities.' },
  { icon: ClipboardCheck, title: 'Vehicle inspections', text: 'Book an inspection before making your decision.' },
  { icon: ShieldCheck, title: 'Secure accounts', text: 'Manage saved cars, bookings, listings, and bids.' },
  { icon: Calculator, title: 'Smart valuations', text: 'Get an estimated market price and expected range.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [filters, setFilters] = useState({ search: '', budget: '', city: '', transmission: '', year: '' })
  const [advanced, setAdvanced] = useState(false)
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const loadCars = useCallback(() => {
    setLoading(true); setLoadError('')
    api.get('/products').then(response => setCars(Array.isArray(response.data) ? response.data : [])).catch(error => setLoadError(error.response?.data?.message || 'Marketplace inventory could not be loaded.')).finally(() => setLoading(false))
  }, [])
  useEffect(loadCars, [loadCars])
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value }))
  const clear = () => setFilters({ search: '', budget: '', city: '', transmission: '', year: '' })
  const submitSearch = event => {
    event.preventDefault()
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (String(value).trim()) params.set(key, String(value).trim()) })
    navigate(`/used-cars${params.toString() ? `?${params}` : ''}`)
  }
  const featured = useMemo(() => {
    const evidenced = cars.filter(car => car.verificationStatus === 'verified' || hasInspectionReport(car))
    return (evidenced.length ? evidenced : cars).slice(0, 4)
  }, [cars])
  const recent = cars.slice(0, 4)

  return <div className="min-h-screen bg-white">
    <Navbar />
    <section className="relative bg-[#0b1628] pt-[68px] md:pt-[100px] overflow-hidden">
      <picture className="absolute inset-0">
        <source type="image/avif" srcSet={`${hero640Avif} 640w, ${hero1280Avif} 1280w, ${hero1746Avif} 1746w`} sizes="100vw" />
        <source type="image/webp" srcSet={`${hero640Webp} 640w, ${hero1280Webp} 1280w, ${hero1746Webp} 1746w`} sizes="100vw" />
        <img src={hero1746Webp} srcSet={`${hero640Webp} 640w, ${hero1280Webp} 1280w, ${hero1746Webp} 1746w`} sizes="100vw" width="1746" height="901" alt="" fetchpriority="high" decoding="async" className="h-full w-full object-cover object-[67%_center] lg:object-center" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-[#061326]/95 via-[#07182bcc] to-[#07182b08]" aria-hidden="true" />
      <div className="relative market-shell py-14 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 rounded-full px-4 py-2 text-xs font-semibold text-blue-200"><Sparkles className="w-4 h-4" /> Buy, sell, inspect, value, and auction</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem] xl:text-6xl">Pakistan&apos;s Smart Automotive Marketplace</h1>
          <p className="mt-4 text-lg font-bold leading-7 text-blue-300 sm:text-xl">{siteConfig.tagline}</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">Buy, sell, inspect, value, and auction vehicles through one trusted platform designed for transparency, convenience, and smarter decisions.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8"><Link to="/used-cars" className="btn-primary min-h-12 px-6 text-sm gap-2">Browse Used Cars <ArrowRight className="w-4 h-4" /></Link><Link to="/price-predictor" className="inline-flex items-center justify-center min-h-12 px-6 rounded-lg border border-white/25 bg-white/10 text-white text-sm font-bold transition-colors hover:bg-white/15 gap-2"><Calculator className="w-4 h-4" /> Value My Car</Link></div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 mt-8 text-xs text-slate-400"><span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Used-car marketplace</span><span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Price range with source</span><span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Real-time auction bids</span></div>
        </div>
      </div>

      <div className="relative market-shell pb-8">
        <form onSubmit={submitSearch} className="bg-white rounded-xl p-3 shadow-2xl" aria-label="Search used cars">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_auto] gap-2">
            <label className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><span className="sr-only">Make or model</span><input list="car-suggestions" value={filters.search} onChange={event => update('search', event.target.value)} placeholder="Make or model" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><datalist id="car-suggestions">{[...makes, ...models].map(item => <option key={item} value={item} />)}</datalist></label>
            <label><span className="sr-only">Budget</span><select value={filters.budget} onChange={event => update('budget', event.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm text-gray-700 focus:outline-none focus:border-blue-500"><option value="">Any budget</option>{budgets.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span className="sr-only">City</span><select value={filters.city} onChange={event => update('city', event.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm text-gray-700 focus:outline-none focus:border-blue-500"><option value="">Any city</option>{cities.map(city => <option key={city}>{city}</option>)}</select></label>
            <button className="btn-search h-12 px-7 gap-2"><Search className="w-4 h-4" /> Search</button>
          </div>
          {advanced && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100"><label><span className="sr-only">Transmission</span><select value={filters.transmission} onChange={event => update('transmission', event.target.value)} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm"><option value="">Any transmission</option><option>Auto</option><option>Manual</option></select></label><label><span className="sr-only">Minimum model year</span><select value={filters.year} onChange={event => update('year', event.target.value)} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm"><option value="">Any model year</option>{Array.from({ length: 16 }, (_, index) => currentYear + 1 - index).map(year => <option key={year}>{year}</option>)}</select></label><button type="button" onClick={clear} className="h-11 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">Clear filters</button></div>}
          <button type="button" onClick={() => setAdvanced(value => !value)} className="text-xs font-bold text-blue-700 hover:text-blue-900 mt-3 ml-1">{advanced ? 'Hide advanced filters' : 'Advanced filters'}</button>
        </form>
      </div>
    </section>

    <section className="border-b border-gray-200 bg-white"><div className="market-shell grid sm:grid-cols-2 lg:grid-cols-4">{trustItems.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-3 px-4 py-6 border-b sm:border-b-0 sm:border-r last:border-r-0 border-gray-100"><div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-blue-700" /></div><div><h2 className="text-sm font-black text-gray-900">{title}</h2><p className="text-xs text-gray-500 leading-5 mt-1">{text}</p></div></div>)}</div></section>

    <InventorySection title="Featured Used Cars" eyebrow="Marketplace inventory" cars={featured} loading={loading} error={loadError} onRetry={loadCars} empty="No cars are available to feature yet." />

    <section className="py-14 bg-gray-50 border-y border-gray-200"><div className="market-shell"><SectionHeading align="center" eyebrow="Managed selling service" title="Let our showroom team help you sell" description="Book an inspection, get pricing guidance, and let Executive Cars prepare the listing and coordinate buyer enquiries." /><div className="max-w-2xl mx-auto mt-9"><SellCard icon={Sparkles} title="Sell It For Me" text="Start with a vehicle inspection and track the managed process from your Executive Cars account." points={['Book an inspection', 'Get pricing guidance', 'Managed listing and enquiries']} action="Book an Inspection" to="/seller/book-inspection" featured /></div></div></section>

    <section className="py-14 lg:py-16 bg-white"><div className="market-shell"><SectionHeading align="center" eyebrow="Simple process" title="How Executive Cars works" /><div className="grid md:grid-cols-3 gap-5 mt-9">{[
      { icon: Search, step: '01', title: 'Search or submit', text: 'Browse current inventory or submit your own vehicle information.' },
      { icon: ClipboardCheck, step: '02', title: 'Inspect and review', text: 'Review vehicle details and book an inspection when you need a closer look.' },
      { icon: Gavel, step: '03', title: 'Buy, sell, or bid', text: 'Contact a seller, track your listing, or join an eligible live auction.' },
    ].map(({ icon: Icon, step, title, text }) => <article key={step} className="card p-6"><div className="flex items-center justify-between"><div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-blue-700" /></div><span className="text-2xl font-black text-blue-100">{step}</span></div><h3 className="font-black text-gray-900 mt-5">{title}</h3><p className="text-sm text-gray-500 leading-6 mt-2">{text}</p></article>)}</div></div></section>

    <section className="py-14 bg-[#0f172a]"><div className="market-shell grid lg:grid-cols-2 gap-6"><Promo icon={Brain} eyebrow="Smart valuation" title="Understand your car’s market value" text="Enter your vehicle details to see an estimated price, expected range, and the key factors that shape its value." action="Value my car" to="/price-predictor" /><Promo icon={Gavel} eyebrow="Vehicle auctions" title="Follow live bids in real time" text="Eligible members can view countdowns, current bids, and bid updates through the auction portal." action="Explore auctions" to="/auction" /></div></section>

    <InventorySection title="Recently Added Cars" eyebrow="Latest listings" cars={recent} loading={loading} error={loadError} onRetry={loadCars} empty="No recent listings are available." />

    <section className="py-14 bg-gray-50 border-y border-gray-200"><div className="market-shell grid lg:grid-cols-2 gap-8"><BrowsePanel title="Browse Cars by Make">{makes.map(make => <Link key={make} to={`/used-cars?search=${make}`} className="browse-link">{make} Cars <ChevronRight className="w-4 h-4" /></Link>)}</BrowsePanel><BrowsePanel title="Browse Cars by Budget">{budgets.map(item => <Link key={item.value} to={`/used-cars?budget=${item.value}`} className="browse-link">{item.label} <ChevronRight className="w-4 h-4" /></Link>)}</BrowsePanel></div></section>

    <section className="py-14 bg-white"><div className="market-shell text-center max-w-3xl"><TrendingUp className="w-10 h-10 text-blue-700 mx-auto" /><h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-4">Make every car decision with clarity</h2><p className="text-sm text-gray-500 leading-7 mt-3">Explore vehicles, arrange inspections, estimate market value, manage your selling journey, and participate in auctions from one account.</p><div className="flex flex-col sm:flex-row justify-center gap-3 mt-6"><Link to="/used-cars" className="btn-primary min-h-11 px-6 text-sm">Browse used cars</Link><Link to="/signup" className="btn-ghost min-h-11 px-6 text-sm inline-flex items-center justify-center">Create one account</Link></div></div></section>
    <Footer />
  </div>
}

function InventorySection({ eyebrow, title, cars, loading, error, onRetry, empty }) {
  return <section className="py-14 lg:py-16 bg-white"><div className="market-shell"><SectionHeading eyebrow={eyebrow} title={title} action={<Link to="/used-cars" className="text-sm font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1.5">View all cars <ArrowRight className="w-4 h-4" /></Link>} /><div className="mt-7">{loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{[1, 2, 3, 4].map(item => <Skeleton key={item} className="h-80" />)}</div> : error ? <div className="border border-red-200 rounded-xl"><ErrorState title="Could not load cars" description={error} onRetry={onRetry} /></div> : cars.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{cars.map(car => <VehicleCard key={car._id} car={car} compact />)}</div> : <div className="border border-gray-200 rounded-xl"><EmptyState icon={Car} title={empty} description="Please check back soon for newly added vehicles." /></div>}</div></div></section>
}
function SellCard({ icon: Icon, title, text, points, action, to, featured }) { return <article className={`bg-white rounded-xl border ${featured ? 'border-blue-300 shadow-elevated' : 'border-gray-200 shadow-card'} p-6 sm:p-7`}><div className="flex items-start gap-4"><div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${featured ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}><Icon className="w-6 h-6" /></div><div><h3 className="text-xl font-black text-gray-900">{title}</h3><p className="text-sm text-gray-500 leading-6 mt-1">{text}</p></div></div><ul className="flex flex-wrap gap-x-5 gap-y-2 mt-5">{points.map(point => <li key={point} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-600" />{point}</li>)}</ul><Link to={to} className={`${featured ? 'btn-primary' : 'btn-ghost'} w-full sm:w-auto px-6 py-3 text-sm gap-2 mt-6 inline-flex items-center justify-center`}>{action}<ArrowRight className="w-4 h-4" /></Link></article> }
function Promo({ icon: Icon, eyebrow, title, text, action, to }) { return <article className="border border-white/10 bg-white/[0.06] rounded-xl p-6 sm:p-8"><div className="w-12 h-12 bg-blue-500/20 border border-blue-400/20 rounded-xl flex items-center justify-center"><Icon className="w-6 h-6 text-blue-300" /></div><p className="text-xs font-bold uppercase tracking-widest text-blue-300 mt-6">{eyebrow}</p><h2 className="text-2xl font-black text-white mt-2">{title}</h2><p className="text-sm text-slate-400 leading-6 mt-3">{text}</p><Link to={to} className="inline-flex items-center gap-2 text-sm font-bold text-white mt-6 hover:text-blue-300">{action}<ArrowRight className="w-4 h-4" /></Link></article> }
function BrowsePanel({ title, children }) { return <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-card"><h2 className="text-xl font-black text-gray-900 mb-5">{title}</h2><div className="grid sm:grid-cols-2 gap-3">{children}</div></div> }
