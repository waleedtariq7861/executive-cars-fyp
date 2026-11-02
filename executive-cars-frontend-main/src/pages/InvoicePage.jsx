import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import api from '../api/api.js'
import Logo from '../components/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { Alert } from '../components/ui/Feedback.jsx'
import { readApiError } from '../utils/apiError.js'
import { formatMoney } from '../utils/payment.js'

const date = value => (value ? new Date(value).toLocaleDateString('en-PK', { dateStyle: 'long' }) : '—')

// A printable invoice for one paid payment. It is read from the server, which builds it from the copy of the
// billing details taken when the payment was made, so it reads the same every time.
export default function InvoicePage() {
  const { id } = useParams()
  const [state, setState] = useState({ status: 'loading', invoice: null, message: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    setState({ status: 'loading', invoice: null, message: '' })
    api.get(`/payments/${id}/invoice`)
      .then(({ data }) => { if (current) setState({ status: 'ready', invoice: data.invoice, message: '' }) })
      .catch(error => { if (current) setState({ status: 'error', invoice: null, message: readApiError(error, 'The invoice could not be loaded.').message }) })
    return () => { current = false }
  }, [id, attempt])

  const { invoice } = state

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link to="/account/payments" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"><ArrowLeft className="w-4 h-4" /> My payments</Link>
          {invoice && <Button type="button" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print or save as PDF</Button>}
        </div>

        {state.status === 'loading' && <p role="status" className="text-sm text-gray-500">Loading the invoice…</p>}
        {state.status === 'error' && <Alert tone="error">{state.message} <button type="button" onClick={() => setAttempt(value => value + 1)} className="font-bold underline">Try again</button></Alert>}

        {invoice && (
          <article aria-label={`Invoice ${invoice.invoiceNumber}`} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none">
            {invoice.sandbox && <p aria-hidden="true" className="pointer-events-none absolute right-[-3.5rem] top-10 rotate-45 bg-amber-100 px-16 py-1 text-xs font-black uppercase tracking-widest text-amber-800">Sandbox</p>}
            <header className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-center gap-3"><Logo className="w-10 h-10" /><div><p className="font-black text-gray-900 text-lg leading-none">{invoice.seller.name}</p><p className="text-xs text-gray-500 mt-1">{invoice.seller.address}</p><p className="text-xs text-gray-500">{invoice.seller.email}</p></div></div>
              <div className="text-right"><h1 className="text-3xl font-black tracking-tight text-gray-900">INVOICE</h1><p className="mt-1 font-mono text-sm font-bold text-gray-700">{invoice.invoiceNumber}</p><span className="mt-2 inline-block rounded-full border border-green-300 bg-green-50 px-3 py-0.5 text-xs font-black tracking-wide text-green-700">{invoice.status}</span></div>
            </header>

            <section className="mt-8 grid gap-6 sm:grid-cols-2">
              <div><h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Billed to</h2><p className="mt-1 font-semibold text-gray-900">{invoice.buyer.name}</p><p className="text-sm text-gray-600">{invoice.buyer.email}</p>{invoice.buyer.phone && <p className="text-sm text-gray-600">{invoice.buyer.phone}</p>}</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:justify-self-end">
                <dt className="text-gray-500">Issued</dt><dd className="text-right text-gray-900">{date(invoice.issuedAt)}</dd>
                <dt className="text-gray-500">Paid</dt><dd className="text-right text-gray-900">{date(invoice.payment.paidAt)}</dd>
                <dt className="text-gray-500">Payment reference</dt><dd className="text-right font-mono text-gray-900">{invoice.payment.reference}</dd>
                <dt className="text-gray-500">Paid with</dt><dd className="text-right text-gray-900">{invoice.payment.methodLabel}</dd>
              </dl>
            </section>

            <table className="mt-8 w-full text-sm">
              <caption className="sr-only">Items on this invoice</caption>
              <thead><tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wide text-gray-500"><th scope="col" className="py-2 font-bold">Description</th><th scope="col" className="py-2 text-right font-bold">Qty</th><th scope="col" className="py-2 text-right font-bold">Unit price</th><th scope="col" className="py-2 text-right font-bold">Amount</th></tr></thead>
              <tbody>{invoice.lineItems.map(item => (
                <tr key={item.description} className="border-b border-gray-100"><td className="py-3 text-gray-900">{item.description}{invoice.coverage && <span className="block text-xs text-gray-500">Valid {date(invoice.coverage.from)} to {date(invoice.coverage.to)}</span>}</td><td className="py-3 text-right text-gray-700">{item.quantity}</td><td className="py-3 text-right text-gray-700">{formatMoney(item.unitPrice, invoice.currency)}</td><td className="py-3 text-right font-semibold text-gray-900">{formatMoney(item.amount, invoice.currency)}</td></tr>
              ))}</tbody>
            </table>

            <dl className="ml-auto mt-6 w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="text-gray-900">{formatMoney(invoice.subtotal, invoice.currency)}</dd></div>
              <div className="flex justify-between border-t border-gray-300 pt-2 text-base"><dt className="font-bold text-gray-900">Total</dt><dd className="font-black text-gray-900">{formatMoney(invoice.total, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Amount paid</dt><dd className="font-semibold text-green-700">{formatMoney(invoice.amountPaid, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Balance due</dt><dd className="text-gray-900">{formatMoney(0, invoice.currency)}</dd></div>
            </dl>

            {invoice.sandbox && <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">This invoice was issued for a sandbox payment: no real money was charged and it is not a tax document.</p>}
          </article>
        )}
      </div>
    </div>
  )
}
