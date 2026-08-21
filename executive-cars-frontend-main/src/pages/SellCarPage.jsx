import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const managedBenefits = [
  'Inspection booking',
  'Price guidance',
  'Managed listing preparation',
  'Showroom team handles enquiries',
]

export default function SellCarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <section className="relative overflow-hidden bg-[#0f172a] pb-28 pt-[116px] md:pb-32 md:pt-[140px]">
        <div className="surface-grid absolute inset-0 opacity-40" />
        <div className="market-shell relative max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-xs font-semibold text-blue-200">
            <BadgeCheck className="h-4 w-4" /> Managed vehicle selling
          </span>
          <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">
            Sell your car with showroom support
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Book a vehicle inspection and let the Executive Cars team guide valuation, prepare the listing, and coordinate buyer enquiries.
          </p>
        </div>
      </section>

      <main className="market-shell pb-12 lg:pb-16">
        <article className="relative z-10 mx-auto -mt-20 max-w-2xl overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-elevated">
          <div className="h-1.5 bg-blue-600" />
          <div className="p-6 sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  Managed service
                </span>
                <h2 className="mt-3 text-2xl font-black text-gray-900 sm:text-3xl">Sell It For Me</h2>
                <p className="mt-1 text-sm font-semibold text-blue-700">
                  Executive Cars manages the selling journey
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-gray-600 sm:text-base">
              Start with a showroom inspection. Our team will help with price guidance, verification, listing preparation, and buyer coordination using the existing managed-selling process.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {managedBenefits.map(point => (
                <li key={point} className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3.5 py-3 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  {point}
                </li>
              ))}
            </ul>

            <Link
              to="/seller/book-inspection"
              className="btn-primary mt-7 w-full gap-2 py-3.5 text-sm sm:w-auto sm:px-8"
            >
              Book an Inspection <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs leading-5 text-gray-500">
              An Executive Cars member account is required. If you are signed out, you will return to the booking page after signing in.
            </p>
          </div>
        </article>

        <section className="mx-auto mt-16 max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">A reviewed marketplace</span>
            <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">What happens next?</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Inspection and listing status are recorded only after the relevant showroom checks and administrator review are completed.
            </p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {[
              { icon: ClipboardCheck, step: '01', title: 'Book an inspection', text: 'Provide your contact and vehicle details, then choose an available showroom slot.' },
              { icon: ShieldCheck, step: '02', title: 'Review & guidance', text: 'The team reviews the request, inspects the vehicle, and provides pricing guidance.' },
              { icon: Users, step: '03', title: 'Prepare & connect', text: 'An approved vehicle can be prepared for the marketplace and managed buyer enquiries.' },
            ].map(({ icon: Icon, step, title, text }) => (
              <div key={step} className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-blue-100">{step}</span>
                </div>
                <h3 className="mt-5 font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 flex max-w-5xl flex-col gap-6 rounded-xl bg-blue-600 p-6 text-white sm:p-8 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">Already have an Executive Cars account?</h2>
            <p className="mt-1 text-sm text-blue-100">Use the same account to track inspection bookings, listings, purchases, and auction access.</p>
          </div>
          <Link to="/account" className="btn-white whitespace-nowrap px-6 py-3 text-sm md:ml-auto">
            My account <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
