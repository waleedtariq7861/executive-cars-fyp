import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Gavel, TrendingUp, Trophy, User, LogOut, Bell, Menu, X, Car } from 'lucide-react'
import Logo from './Logo.jsx'
import { useAuth } from '../context/authContext.js'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/auction/dashboard' },
  { icon: Gavel,           label: 'Live Auctions', to: '/auction/live'      },
  { icon: TrendingUp,      label: 'My Bids',       to: '/auction/my-bids'   },
  { icon: Trophy,          label: 'Won Cars',       to: '/auction/won-cars'  },
  { icon: User,            label: 'Profile',        to: '/auction/profile'   },
]

export default function AuctionLayout({ children, title }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/auction') }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <div>
              <span className="text-gray-900 font-bold text-sm block">Executive <span className="primary-text">Cars</span></span>
              <span className="text-gray-400 text-xs">Auction Portal</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.to
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Member badge */}
        <div className="mx-4 mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 font-semibold text-xs truncate">{user?.name || 'Member'}</p>
              <p className="text-blue-600 text-xs font-medium">Unified Account</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all w-full"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button type="button" aria-label="Close navigation" tabIndex={-1} className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-gray-900 font-bold text-lg">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block badge-blue text-xs px-3 py-1.5 rounded-full font-semibold">
              Auction Member
            </span>
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 border-2 border-white" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
