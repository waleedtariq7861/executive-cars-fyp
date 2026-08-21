import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'
import { Car, Users, Calendar, Gavel, List, Upload, PlusCircle, LogOut, Menu, X, Shield, BarChart3, Database } from 'lucide-react'
import Logo from './Logo.jsx'

const navItems = [
  { icon: BarChart3, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: Users, label: 'Customer Accounts', to: '/admin/users' },
  { icon: Calendar, label: 'Bookings', to: '/admin/bookings' },
  { icon: Gavel, label: 'Auction List', to: '/admin/auction-list' },
  { icon: List, label: 'Used Cars List', to: '/admin/used-cars-list' },
  { icon: Upload, label: 'Upload Auction Car', to: '/admin/upload-auction' },
  { icon: PlusCircle, label: 'Upload Used Car', to: '/admin/upload-used-car' },
  { icon: Database, label: 'Data & Models', to: '/admin/data-models' },
]

export default function AdminLayout({ children, title }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/admin') }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <div>
              <span className="text-gray-900 font-bold text-sm block">Executive <span className="primary-text">Cars</span></span>
              <span className="text-gray-400 text-xs">Admin Portal</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.to ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all w-full">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-gray-500 hover:text-gray-700">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-gray-900 font-bold text-lg">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-gray-500 text-sm">Administrator</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
