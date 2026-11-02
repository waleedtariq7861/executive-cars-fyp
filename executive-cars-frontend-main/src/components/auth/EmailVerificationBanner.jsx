import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MailWarning } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'

// Shown to a signed-in customer whose email address is not confirmed yet. They can keep using the account;
// bidding and membership activation need the confirmation.
export default function EmailVerificationBanner({ className = '' }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user?.role !== 'user' || user.emailVerified !== false) return null
  return (
    <div role="status" className={`flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center ${className}`}>
      <MailWarning className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <p className="text-sm text-amber-900">Verify your email address to place bids and activate auction membership.</p>
      <Link to="/verify-email" state={{ next: location.pathname }} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 sm:ml-auto">Verify email</Link>
    </div>
  )
}
