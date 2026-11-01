import React, { useCallback, useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import api from '../../api/api.js'
import Button from '../../components/ui/Button.jsx'
import { Alert } from '../../components/ui/Feedback.jsx'
import { Modal } from '../../components/ui/Overlays.jsx'
import { FormField, Input, Select } from '../../components/ui/FormControls.jsx'
import { readApiError } from '../../utils/apiError.js'
import { formatMoney, STATUS_LABELS } from '../../utils/payment.js'

const FILTERS = [['', 'All'], ['pending_verification', 'Awaiting confirmation'], ['succeeded', 'Paid'], ['failed', 'Failed'], ['expired', 'Expired']]
const when = value => (value ? new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—')

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState('')
  const [state, setState] = useState({ status: 'loading', payments: [], summary: null, message: '' })
  const [notice, setNotice] = useState('')
  const [acting, setActing] = useState(null) // { payment, kind: 'confirm' | 'reject' }
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(() => {
    setState(previous => ({ ...previous, status: 'loading' }))
    api.get('/admin/payments', { params: filter ? { status: filter } : {} })
      .then(({ data }) => setState({ status: 'ready', payments: data.payments, summary: data.summary, message: '' }))
      .catch(error => setState({ status: 'error', payments: [], summary: null, message: readApiError(error, 'Payments could not be loaded.').message }))
  }, [filter])

  useEffect(() => { load() }, [load, attempt])

  const close = () => { setActing(null); setReason('') }

  const act = async () => {
    if (!acting || saving) return
    setSaving(true)
    setNotice('')
    try {
      const body = acting.kind === 'reject' ? { reason } : {}
      await api.post(`/admin/payments/${acting.payment.id}/${acting.kind}`, body)
      setNotice(acting.kind === 'confirm' ? `Payment ${acting.payment.reference} confirmed. The membership is active and the invoice was issued.` : `Payment ${acting.payment.reference} rejected.`)
      close()
      load()
    } catch (error) {
      setNotice(readApiError(error, 'The payment could not be updated.').message)
      close()
      load()
    } finally {
      setSaving(false)
    }
  }

  const { summary } = state

  return (
    <AdminLayout title="Payments">
      <div className="space-y-6">
        {summary && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-xs text-gray-500">Paid</p><p className="mt-1 text-2xl font-black text-gray-900">{summary.succeededCount}</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-xs text-gray-500">Total received</p><p className="mt-1 text-2xl font-black text-gray-900">{formatMoney(summary.succeededTotal, summary.currency)}</p></div>
            <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-xs text-gray-500">Awaiting confirmation</p><p className="mt-1 text-2xl font-black text-gray-900">{summary.pendingVerification}</p></div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Show" htmlFor="payment-filter" className="w-56">
            <Select id="payment-filter" value={filter} onChange={event => setFilter(event.target.value)}>{FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          </FormField>
        </div>

        {notice && <Alert tone="success">{notice}</Alert>}
        {state.status === 'error' && <Alert tone="error">{state.message} <button type="button" onClick={() => setAttempt(value => value + 1)} className="font-bold underline">Try again</button></Alert>}
        {state.status === 'loading' && <p role="status" className="text-sm text-gray-500">Loading payments…</p>}

        {state.status === 'ready' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Payments</caption>
              <thead><tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="px-4 py-3 font-bold">Reference</th><th scope="col" className="px-4 py-3 font-bold">Customer</th><th scope="col" className="px-4 py-3 font-bold">Method</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Amount</th><th scope="col" className="px-4 py-3 font-bold">Status</th><th scope="col" className="px-4 py-3 font-bold">Date</th><th scope="col" className="px-4 py-3 font-bold"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {state.payments.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No payments found</td></tr>}
                {state.payments.map(payment => (
                  <tr key={payment.id} className="border-b border-gray-100 align-top">
                    <td className="px-4 py-3"><span className="font-mono text-xs">{payment.reference}</span>{payment.invoiceNumber && <span className="block text-xs text-gray-500">{payment.invoiceNumber}</span>}</td>
                    <td className="px-4 py-3">{payment.member ? <><span className="font-semibold text-gray-900">{payment.member.name}</span><span className="block text-xs text-gray-500">{payment.member.email}</span></> : '—'}</td>
                    <td className="px-4 py-3">{payment.methodLabel || '—'}{payment.method === 'bank_transfer' && payment.transferDate && <span className="block text-xs text-gray-500">Transferred {new Date(payment.transferDate).toLocaleDateString('en-PK')}</span>}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="px-4 py-3">{STATUS_LABELS[payment.status] || payment.status}{payment.status === 'failed' && payment.failureMessage && <span className="block text-xs text-red-600">{payment.failureMessage}</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{when(payment.paidAt || payment.submittedAt || payment.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {payment.status === 'pending_verification' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setActing({ payment, kind: 'confirm' })} aria-label={`Confirm payment ${payment.reference}`}>Confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => setActing({ payment, kind: 'reject' })} aria-label={`Reject payment ${payment.reference}`}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(acting)} onClose={close} size="sm"
        title={acting?.kind === 'confirm' ? 'Confirm this bank transfer?' : 'Reject this bank transfer?'}
        description={acting ? `${acting.payment.reference}: ${formatMoney(acting.payment.amount, acting.payment.currency)} from ${acting.payment.member?.name || 'the customer'}, transaction ${acting.payment.bankReference}.` : ''}
        footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button variant={acting?.kind === 'reject' ? 'danger' : 'primary'} loading={saving} onClick={act}>{acting?.kind === 'confirm' ? 'Confirm payment' : 'Reject payment'}</Button></>}
      >
        {acting?.kind === 'confirm' && <p className="text-sm text-gray-600">Confirming activates the customer&apos;s membership and issues the invoice. Only confirm once you have seen the deposit.</p>}
        {acting?.kind === 'reject' && <FormField label="Reason shown to the customer" htmlFor="reject-reason"><Input id="reject-reason" value={reason} maxLength={200} placeholder="No deposit found for that transaction ID." onChange={event => setReason(event.target.value)} /></FormField>}
      </Modal>
    </AdminLayout>
  )
}
