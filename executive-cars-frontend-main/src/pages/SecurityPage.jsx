import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import ActivityList from '../components/auth/ActivityList.jsx'
import ChangePasswordForm from '../components/auth/ChangePasswordForm.jsx'
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner.jsx'
import SessionsPanel from '../components/auth/SessionsPanel.jsx'

const Section = ({ title, description, children }) => (
  <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-card">
    <h2 className="font-black text-gray-900">{title}</h2>
    {description && <p className="text-sm text-gray-500 mt-1 mb-5">{description}</p>}
    {children}
  </section>
)

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-[68px] md:pt-[100px]">
        <section className="bg-[#0f172a] py-10">
          <div className="market-shell">
            <Link to="/account" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300"><ArrowLeft className="w-4 h-4" /> My account</Link>
            <h1 className="text-3xl font-black text-white mt-3">Security</h1>
            <p className="text-slate-400 text-sm mt-1">Your password, the devices you are signed in on, and recent activity on your account.</p>
          </div>
        </section>
        <div className="market-shell py-10 space-y-6 max-w-3xl">
          <EmailVerificationBanner />
          <Section title="Change password" description="Choose a password you do not use anywhere else. Changing it signs your other devices out.">
            <ChangePasswordForm idPrefix="security-password" />
          </Section>
          <Section title="Where you are signed in" description="If you do not recognise a device, sign it out and change your password.">
            <SessionsPanel />
          </Section>
          <Section title="Recent activity" description="Sign-ins, password changes and similar events on your account.">
            <ActivityList />
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
