import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import Logo from './Logo.jsx'
import { siteConfig } from '../config/site.js'

const columns = [
  { title: 'Buy a Car', links: [{ label: 'Used Cars', to: '/used-cars' }, { label: 'Auctions', to: '/auction' }, { label: 'Price Predictor', to: '/price-predictor' }] },
  { title: 'Sell a Car', links: [{ label: 'Managed Selling', to: '/sell-car' }, { label: 'Book Inspection', to: '/seller/book-inspection' }, { label: 'Selling Dashboard', to: '/seller/dashboard' }] },
  { title: 'Account', links: [{ label: 'Sign In', to: '/login' }, { label: 'Create Account', to: '/signup' }, { label: 'My Account', to: '/account' }] },
]

export default function Footer() {
  const hasContact = Boolean(siteConfig.address || siteConfig.phone || siteConfig.email)
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="market-shell py-12 lg:py-14">
        <div className={`grid sm:grid-cols-2 ${hasContact ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-9`}>
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Executive Cars home"><Logo className="w-10 h-10" /><div className="leading-none"><span className="block font-black text-gray-900">Executive</span><span className="block text-blue-600 font-bold text-[10px] tracking-[0.2em] mt-1">CARS</span></div></Link>
            <p className="mt-4 max-w-xs text-sm font-bold leading-6 text-slate-700">{siteConfig.tagline}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">A Pakistan-focused marketplace for used-car listings, valuation guidance, inspections, and auctions.</p>
          </div>
          {columns.map(column => <div key={column.title}><h2 className="font-bold text-gray-900 text-sm mb-5">{column.title}</h2><ul className="space-y-3">{column.links.map(link => <li key={link.label}><Link to={link.to} className="text-sm text-gray-500 hover:text-blue-600">{link.label}</Link></li>)}</ul></div>)}
          {hasContact && <div>
            <h2 className="font-bold text-gray-900 text-sm mb-5">Contact</h2>
            <ul className="space-y-3 text-sm text-gray-500">
              {siteConfig.address && <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /> {siteConfig.address}</li>}
              {siteConfig.phone && <li><a href={`tel:${siteConfig.phone}`} className="flex items-center gap-2 hover:text-blue-600"><Phone className="w-4 h-4 text-blue-600" /> {siteConfig.phoneLabel || siteConfig.phone}</a></li>}
              {siteConfig.email && <li><a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 hover:text-blue-600"><Mail className="w-4 h-4 text-blue-600" /> {siteConfig.email}</a></li>}
            </ul>
          </div>}
        </div>
        <div className="border-t border-gray-200 mt-11 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Executive Cars. All rights reserved.</p>
          <div className="flex items-center gap-4"><Link to="/privacy" className="hover:text-blue-600">Privacy</Link><Link to="/terms" className="hover:text-blue-600">Terms</Link></div>
        </div>
      </div>
    </footer>
  )
}
