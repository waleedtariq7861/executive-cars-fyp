import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Bot, Calculator, Car, ClipboardCheck, Gavel, Heart, LayoutDashboard,
  LogOut, MapPin, Menu, MoreHorizontal, Search, UserRound, X,
} from 'lucide-react'
import Logo from './Logo.jsx'
import { useAuth } from '../context/authContext.js'
import { siteConfig } from '../config/site.js'
import { Dropdown, DropdownItem } from './ui/Navigation.jsx'

const navigation = [
  { label: 'Used Cars', to: '/used-cars', icon: Search },
  { label: 'Price Predictor', to: '/price-predictor', icon: Calculator },
  { label: 'Auctions', to: '/auction', icon: Gavel },
]
const sellLink = { label: 'Sell Your Car', to: '/sell-car', icon: Car }
const secondary = [
  { label: 'Book Inspection', to: '/seller/book-inspection', icon: ClipboardCheck },
  { label: 'AI Car Assistant', to: '/?assistant=open', icon: Bot },
  { label: 'Saved Cars', to: '/saved-cars', icon: Heart },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  const accountPath = user?.role === 'admin' ? '/admin/dashboard' : '/account'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setMobileOpen(false), [location.pathname, location.search])
  const isActive = to => location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`))

  return <>
    <header className={`fixed inset-x-0 top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-lg' : ''}`}>
      <div className="hidden md:block h-8 bg-blue-700"><div className="market-shell h-full flex items-center text-[11px] text-blue-100"><span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {siteConfig.city}</span><span className="ml-auto">Pakistan-focused used-car marketplace</span></div></div>
      <nav className="h-[68px] border-b border-gray-200" aria-label="Primary navigation">
        <div className="market-shell h-full flex items-center">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Executive Cars home"><Logo className="w-10 h-10" /><div className="leading-none"><span className="block text-gray-900 font-black text-[17px] tracking-tight">Executive</span><span className="block text-blue-600 font-bold text-[11px] tracking-[0.2em] mt-1">CARS</span></div></Link>
          <div className="hidden xl:flex items-center ml-8 h-full">{navigation.map(link => <Link key={link.to} to={link.to} aria-current={isActive(link.to) ? 'page' : undefined} className={`h-full px-3.5 inline-flex items-center text-[13px] font-semibold border-b-[3px] transition-colors ${isActive(link.to) ? 'text-blue-700 border-blue-600 bg-blue-50/60' : 'text-gray-600 border-transparent hover:text-blue-700 hover:bg-gray-50'}`}>{link.label}</Link>)}</div>
          <div className="ml-auto hidden lg:flex items-center gap-2">
            <Dropdown label={<span className="inline-flex items-center gap-1.5"><MoreHorizontal className="w-4 h-4" />More</span>}>{secondary.map(item => <DropdownItem key={item.to} {...item}>{item.label}</DropdownItem>)}{!user && <DropdownItem to="/account" icon={UserRound}>My Account</DropdownItem>}</Dropdown>
            <Link to={sellLink.to} aria-current={isActive(sellLink.to) ? 'page' : undefined} className="btn-primary min-h-10 px-4 text-sm gap-2"><Car className="w-4 h-4" />Sell Your Car</Link>
            {user ? <Dropdown label={<span className="inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-blue-700 text-white inline-flex items-center justify-center text-xs font-black">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span><span className="max-w-28 truncate">{user.name?.split(' ')[0]}</span></span>}><DropdownItem to={accountPath} icon={user.role === 'admin' ? LayoutDashboard : UserRound}>{user.role === 'admin' ? 'Admin Dashboard' : 'My Account'}</DropdownItem><button type="button" onClick={logout} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" />Sign out</button></Dropdown> : <Link to="/login" className="btn-ghost min-h-10 px-4 text-sm gap-2 inline-flex items-center justify-center"><UserRound className="w-4 h-4" /> Sign In</Link>}
          </div>
          <button type="button" onClick={() => setMobileOpen(open => !open)} className="ml-auto lg:hidden w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
      </nav>
    </header>

    <div className={`fixed inset-0 z-40 lg:hidden transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} aria-hidden={!mobileOpen}>
      <button className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
      <aside className={`absolute top-0 right-0 h-full w-[min(88vw,360px)] bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Mobile navigation">
        <div className="px-5 py-5 border-b border-gray-200 flex items-center justify-between"><Link to="/" className="flex items-center gap-2.5"><Logo className="w-9 h-9" /><span className="font-black text-gray-900">Executive <span className="text-blue-600">Cars</span></span></Link><button onClick={() => setMobileOpen(false)} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center" aria-label="Close menu"><X className="w-5 h-5" /></button></div>
        <div className="p-4 overflow-y-auto h-[calc(100%-80px)]"><MobileLink to="/" icon={Car} active={location.pathname === '/'}>Home</MobileLink>{navigation.map(({ label, to, icon }) => <MobileLink key={to} to={to} icon={icon} active={isActive(to)}>{label}</MobileLink>)}<Link to={sellLink.to} aria-current={isActive(sellLink.to) ? 'page' : undefined} className="btn-primary w-full min-h-11 px-4 text-sm gap-2 my-3"><Car className="w-4 h-4" />Sell Your Car</Link><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mt-6 mb-2">More</p>{secondary.map(item => <MobileLink key={item.to} to={item.to} icon={item.icon}>{item.label}</MobileLink>)}<div className="border-t border-gray-200 mt-5 pt-4">{user ? <><MobileLink to={accountPath} icon={UserRound}>{user.role === 'admin' ? 'Admin Dashboard' : 'My Account'}</MobileLink><button type="button" onClick={logout} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" />Sign out</button></> : <Link to="/login" className="btn-ghost w-full py-3 text-sm gap-2 inline-flex items-center justify-center"><UserRound className="w-4 h-4" /> Sign In</Link>}</div></div>
      </aside>
    </div>
  </>
}

function MobileLink({ to, icon: Icon, active, children }) { return <Link to={to} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm font-semibold mb-1 ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}><Icon className="w-4 h-4" />{children}</Link> }
