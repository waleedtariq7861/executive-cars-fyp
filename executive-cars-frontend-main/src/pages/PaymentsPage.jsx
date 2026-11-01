import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Receipt } from 'lucide-react'
import api from '../api/api.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import { readApiError } from '../utils/apiError.js'
import { formatMoney, STATUS_LABELS } from '../utils/payment.js'

const TONES = {
  succeeded: 'bg-green-50 text-green-700 border-green-200',
  pending_verification: 'bg-blue-50 text-blue-700 border-blue-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  requires_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  processing: 'bg-amber-50 text-amber-800 border-amber-200',
}

const when = value => (value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—')

export default function PaymentsPage() {
  const [state, setState] = useState({ status: 'loading', payments: [], message: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    setState(previous => ({ ...previous, status: 'loading' }))
    api.get('/payments')
      .then(({ data }) => { if (current) setState({ status: 'ready', payments: data.payments, message: '' }) })
      .catch(error => { if (current) setState({ status: 'error', payments: [], message: readApiError(error, 'Your payments could not be loaded.').message }) })
    return () => { current = false }
  }, [attempt])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-[68px] md:pt-[100px]">
        <div className="market-shell py-10 max-w-4xl">
          <Link to="/account" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"><ArrowLeft className="w-4 h-4" /> My account</Link>
          <div className="mt-4 flex items-center gap-3"><div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center"><Receipt className="w-5 h-5 text-blue-600" /></div><div><h1 className="text-2xl font-black text-gray-900">Payments &amp; invoices</h1></div></div>

          {state.status === 'loading' && <p role="status" className="mt-8 text-sm text-gray-500">Loading your payments…</p>}
          {state.status === 'error' && <Alert tone="error" className="mt-8">{state.message} <button type="button" onClick={() => setAttempt(value => value + 1)} className="font-bold underline">Try again</button></Alert>}
          {state.status === 'ready' && state.payments.length === 0 && (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center"><p className="font-bold text-gray-900">No payments yet</p><p className="mt-1 text-sm text-gray-500">When you pay for an auction membership it appears here with its invoice.</p><Link to="/auction/payment" className="btn-primary mt-5 px-5 py-2.5 text-sm">Get membership</Link></div>
          )}
          {state.status === 'ready' && state.payments.length > 0 && (
            <ul className="mt-8 space-y-3">
              {state.payments.map(payment => (
                <li key={payment.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-bold text-gray-900">{payment.description}</p><p className="mt-0.5 text-xs text-gray-500">Reference <span className="font-mono">{payment.reference}</span> · {when(payment.paidAt || payment.submittedAt || payment.createdAt)}</p></div>
                    <div className="text-right"><p className="font-black text-gray-900">{formatMoney(payment.amount, payment.currency)}</p><span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONES[payment.status] || TONES.expired}`}>{STATUS_LABELS[payment.status] || payment.status}</span></div>
                  </div>
                  {payment.methodLabel && <p className="mt-2 text-sm text-gray-600">Paid with {payment.methodLabel}</p>}
                  {payment.status === 'failed' && payment.failureMessage && <p className="mt-2 text-sm text-red-700">{payment.failureMessage}</p>}
                  {payment.status === 'pending_verification' && <p className="mt-2 text-sm text-blue-800">Your transfer (transaction {payment.bankReference}) is waiting to be confirmed by an administrator.</p>}
                  {payment.status === 'requires_payment' && <Link to="/auction/payment" className="mt-3 inline-block text-sm font-bold text-blue-700 underline">Continue this payment</Link>}
                  {payment.status === 'succeeded' && <Link to={`/account/payments/${payment.id}/invoice`} className="mt-3 inline-block text-sm font-bold text-blue-700 underline">View invoice {payment.invoiceNumber}</Link>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
