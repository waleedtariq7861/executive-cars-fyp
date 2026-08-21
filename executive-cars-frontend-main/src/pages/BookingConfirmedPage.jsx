import React, { useEffect, useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { CheckCircle, Calendar, MapPin, Mail, Clock } from 'lucide-react'

export default function BookingConfirmedPage() {
  const { state } = useLocation()
  const [show, setShow] = useState(false)

  useEffect(() => { setTimeout(() => setShow(true), 100) }, [])

  if (!state?.date || !state?.branch || !state?.email) {
    return <Navigate to="/seller/book-inspection" replace />
  }

  const formattedDate = new Date(state.date).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className={`bg-white border border-gray-200 rounded-3xl p-10 max-w-md w-full text-center shadow-xl transition-all duration-700 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Inspection Booked!</h1>
        <p className="text-gray-500 mb-6">Your booking has been received. Here are your details:</p>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Inspection Date</p>
              <p className="text-gray-900 font-semibold text-sm">{formattedDate}</p>
            </div>
          </div>
          {state.time && <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-blue-600 shrink-0" /><div><p className="text-xs text-gray-500">Preferred Time</p><p className="text-gray-900 font-semibold text-sm">{state.time}</p></div></div>}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Branch</p>
              <p className="text-gray-900 font-semibold text-sm">{state.branch}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Confirmation sent to</p>
              <p className="text-gray-900 font-semibold text-sm">{state.email}</p>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Our team will review your requested slot and update its status.
          This request stays connected to your Executive Cars member account.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/" className="btn-primary py-3.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-200">
            Back to Home
          </Link>
          <Link to="/account" className="btn-ghost py-3.5 rounded-xl font-semibold text-sm">
            View My Account →
          </Link>
        </div>
      </div>
    </div>
  )
}
