import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Car, CheckCircle2, Gavel, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/authContext.js'
import { hasActiveMembership } from '../utils/membership.js'

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const auctionActive = hasActiveMembership(user)
  const signOut = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-[68px] md:pt-[100px]">
        <section className="bg-[#0f172a] py-10">
          <div className="market-shell flex flex-col sm:flex-row sm:items-center gap-5"><div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black">{user.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'EC'}</div><div><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300"><CheckCircle2 className="w-4 h-4" /> Unified customer account</span><h1 className="text-3xl font-black text-white mt-1">Welcome, {user.name}</h1><p className="text-slate-400 text-sm mt-1">{user.email}</p></div><button onClick={signOut} className="sm:ml-auto btn-white px-4 py-2.5 text-sm gap-2"><LogOut className="w-4 h-4" /> Sign Out</button></div>
        </section>

        <div className="market-shell py-10">
          <div className="grid md:grid-cols-3 gap-5">
            <AccountAction icon={Search} title="Buy a Car" description="Search verified used cars and view inspection-led listings." to="/used-cars" action="Browse cars" />
            <AccountAction icon={Car} title="Sell a Car" description="Submit a car, track verification bookings, listings, and auction status." to="/seller/dashboard" action="Selling dashboard" />
            <AccountAction icon={Gavel} title="Car Auctions" description={auctionActive ? 'Your auction membership is active. View live cars and your bids.' : 'Activate annual membership to access live bidding.'} to={auctionActive ? '/auction/dashboard' : '/auction/payment'} action={auctionActive ? 'Open auctions' : 'Activate membership'} status={auctionActive ? 'Active' : 'Not active'} />
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6 mt-8">
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-card"><div className="flex items-center gap-3"><div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-blue-600" /></div><div><h2 className="font-black text-gray-900">One identity, separate capabilities</h2><p className="text-sm text-gray-500 mt-0.5">Buying and selling are included. Live bidding is an optional subscription.</p></div></div><div className="grid sm:grid-cols-3 gap-3 mt-6">{[{ label: 'Marketplace', value: 'Available' }, { label: 'Selling tools', value: 'Available' }, { label: 'Auction bidding', value: auctionActive ? 'Active' : 'Requires membership' }].map(item => <div key={item.label} className="bg-gray-50 border border-gray-100 rounded-lg p-4"><p className="text-xs text-gray-400">{item.label}</p><p className="text-sm font-bold text-gray-900 mt-1">{item.value}</p></div>)}</div></section>
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-card"><div className="flex items-center gap-3"><UserRound className="w-5 h-5 text-blue-600" /><h2 className="font-black text-gray-900">Account details</h2></div><dl className="space-y-3 mt-5 text-sm"><div><dt className="text-xs text-gray-400">Name</dt><dd className="font-semibold text-gray-900 mt-0.5">{user.name}</dd></div><div><dt className="text-xs text-gray-400">Email</dt><dd className="font-semibold text-gray-900 mt-0.5 break-all">{user.email}</dd></div><div><dt className="text-xs text-gray-400">Seller verification</dt><dd className="font-semibold text-gray-900 mt-0.5">{user.sellerApproved ? 'Approved' : 'Available after car verification'}</dd></div></dl></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function AccountAction({ icon: Icon, title, description, to, action, status }) {
  return <article className="bg-white border border-gray-200 rounded-xl p-6 shadow-card flex flex-col"><div className="flex items-start justify-between"><div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Icon className="w-6 h-6 text-blue-600" /></div>{status && <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${status === 'Active' ? 'badge-green' : 'badge-yellow'}`}>{status}</span>}</div><h2 className="text-xl font-black text-gray-900 mt-5">{title}</h2><p className="text-sm text-gray-500 leading-6 mt-2 mb-6">{description}</p><Link to={to} className="btn-ghost mt-auto py-3 text-sm gap-2">{action}<ArrowRight className="w-4 h-4" /></Link></article>
}
