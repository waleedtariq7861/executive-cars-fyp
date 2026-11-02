import React, { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Building2, CheckCircle, CreditCard, FlaskConical, Lock, Smartphone } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import api from '../../api/api.js'
import Button from '../../components/ui/Button.jsx'
import { Alert } from '../../components/ui/Feedback.jsx'
import { FormField, Input, Select } from '../../components/ui/FormControls.jsx'
import { useAuth } from '../../context/authContext.js'
import { hasActiveMembership } from '../../utils/membership.js'
import useMembershipPlan from '../../hooks/useMembershipPlan.js'
import EmailVerificationBanner from '../../components/auth/EmailVerificationBanner.jsx'
import { readApiError } from '../../utils/apiError.js'
import {
  cardBrand, checkCard, checkTransfer, checkWallet, formatCardNumber, formatExpiry, formatMobile, formatMoney, onlyDigits, parseExpiry,
} from '../../utils/payment.js'

const BENEFITS = [
  'Place bids on live member auctions',
  'View member auction listings',
  'Access available inspection information',
]

const METHOD_ICONS = { card: CreditCard, wallet: Smartphone, bank_transfer: Building2 }
const today = () => new Date().toISOString().slice(0, 10)

export default function AuctionPaymentPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const owned = hasActiveMembership(user)
  const planState = useMembershipPlan(!owned)
  const [methods, setMethods] = useState(null)
  const [payment, setPayment] = useState(null)
  const [setup, setSetup] = useState({ status: 'loading', code: '' })
  const [method, setMethod] = useState('card')
  const [card, setCard] = useState({ name: user?.name || '', number: '', expiry: '', cvc: '' })
  const [wallet, setWallet] = useState({ provider: 'jazzcash', number: '' })
  const [transfer, setTransfer] = useState({ reference: '', date: today() })
  const [fieldErrors, setFieldErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // One payment record per attempt: it is created (or the open one is reused) when the page opens.
  const openPayment = useCallback(async () => {
    try {
      const { data } = await api.post('/payments')
      setPayment(data.payment)
      setSetup({ status: 'ready', code: '' })
    } catch (error) {
      const result = readApiError(error, 'We could not start the payment. Please try again.')
      if (result.code === 'ALREADY_MEMBER') { await refreshUser().catch(() => {}); return }
      if (result.code === 'PAYMENT_PENDING_VERIFICATION') { setPayment(error.response.data.payment); setSetup({ status: 'ready', code: result.code }); return }
      setSetup({ status: 'error', code: result.code || '', message: result.message })
    }
  }, [refreshUser])

  useEffect(() => {
    if (owned) return undefined
    let current = true
    api.get('/payments/methods').then(({ data }) => { if (current) setMethods(data) }).catch(() => { if (current) setSetup({ status: 'error', code: '', message: 'Payment methods could not be loaded.' }) })
    return () => { current = false }
  }, [owned, attempt])

  useEffect(() => {
    if (owned) return
    setSetup({ status: 'loading', code: '' })
    openPayment()
  }, [owned, attempt, openPayment])

  if (owned) return <Navigate to="/auction/dashboard" replace />

  const plan = planState.plan
  const pending = payment?.status === 'pending_verification'
  const ready = setup.status === 'ready' && payment && methods && plan

  const submit = async event => {
    event.preventDefault()
    if (submitting || !ready || pending) return
    setFailure('')
    const errors = method === 'card' ? checkCard(card) : method === 'wallet' ? checkWallet(wallet) : checkTransfer(transfer)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    const body = method === 'card'
      ? { method, card: { name: card.name, number: onlyDigits(card.number), expMonth: parseExpiry(card.expiry).month, expYear: parseExpiry(card.expiry).year, cvc: onlyDigits(card.cvc) } }
      : method === 'wallet' ? { method, wallet: { provider: wallet.provider, number: onlyDigits(wallet.number) } }
        : { method, bankTransfer: { reference: transfer.reference.trim(), date: transfer.date } }
    setSubmitting(true)
    try {
      const { data, status } = await api.post(`/payments/${payment.id}/pay`, body)
      if (status === 202) { setPayment(data.payment); return }
      // The success page re-reads the saved account itself. Refreshing here would flip `owned` and the
      // already-a-member redirect above would send the customer to the dashboard before this navigation lands.
      navigate('/auction/payment-success', { replace: true, state: { payment: data.payment, invoiceNumber: data.invoiceNumber } })
    } catch (error) {
      const result = readApiError(error, 'The payment could not be completed. Please try again.')
      if (result.status === 400) { setFieldErrors(result.fieldErrors); setFailure(Object.keys(result.fieldErrors).length ? '' : result.message); return }
      if (result.status === 402) {
        // The attempt is recorded as failed; a fresh payment is opened so the customer can try another method.
        setFailure(result.message)
        setCard(current => ({ ...current, cvc: '' }))
        await openPayment()
        return
      }
      if (result.code === 'ALREADY_MEMBER') { await refreshUser().catch(() => {}); return }
      if (result.code === 'PAYMENT_EXPIRED' || result.code === 'PAYMENT_CLOSED') { setFailure(result.message); await openPayment(); return }
      setFailure(result.message)
    } finally {
      setSubmitting(false)
    }
  }

  const unverified = setup.code === 'EMAIL_NOT_VERIFIED'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <Logo className="w-8 h-8" />
            <span className="text-gray-900 font-bold text-lg">Executive <span className="primary-text">Cars</span></span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-blue-600" /></div>
            <div className="w-16 h-1 bg-blue-600 rounded-full" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
          </div>
          <div className="flex justify-center gap-16 text-xs"><span className="text-blue-600 font-semibold">Account</span><span className="text-blue-600 font-semibold">Payment</span></div>
        </div>

        <EmailVerificationBanner className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[.9fr_1.1fr] gap-8">
          <section aria-label="Order summary" className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm h-fit">
            <h1 className="text-gray-900 font-black text-2xl">Order summary</h1>
            {planState.status === 'loading' && <p role="status" className="text-sm text-gray-500 mt-4">Loading the plan…</p>}
            {planState.status === 'error' && <Alert tone="error" className="mt-4">The membership plan could not be loaded. <button type="button" onClick={planState.retry} className="font-bold underline">Try again</button></Alert>}
            {plan && (
              <div className="mt-5">
                <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-gray-900">{plan.name}</p><p className="text-sm text-gray-500">{plan.durationYears} year of auction access</p></div><p className="font-bold text-gray-900 whitespace-nowrap">{formatMoney(plan.amount, plan.currency)}</p></div>
                <ul className="space-y-2.5 mt-5">{BENEFITS.map(benefit => <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-600 shrink-0" />{benefit}</li>)}</ul>
                <div className="mt-6 border-t border-gray-200 pt-4 flex items-center justify-between"><span className="text-gray-700 font-semibold">Total due</span><span className="text-blue-600 font-black text-2xl whitespace-nowrap">{formatMoney(plan.amount, plan.currency)}</span></div>
                <div className="mt-4 text-sm text-gray-600"><span className="font-semibold">Billed to:</span> {user?.name}<br />{user?.email}</div>
                {payment && <p className="mt-4 text-xs text-gray-500">Payment reference <span className="font-mono font-semibold text-gray-700">{payment.reference}</span></p>}
              </div>
            )}
          </section>

          <section aria-label="Payment" className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-blue-600" /></div><h2 className="text-xl font-black text-gray-900">Pay securely</h2></div>
            <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <FlaskConical className="w-5 h-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p><strong>Sandbox mode.</strong> No real money is charged. Only the test details shown below are accepted; a real card or wallet number is refused and never stored.</p>
            </div>

            {setup.status === 'loading' && <p role="status" className="text-sm text-gray-500 mt-6">Preparing your payment…</p>}
            {setup.status === 'error' && !unverified && <Alert tone="error" className="mt-6">{setup.message || 'We could not start the payment.'} <button type="button" onClick={() => setAttempt(value => value + 1)} className="font-bold underline">Try again</button></Alert>}
            {setup.status === 'error' && unverified && <Alert tone="error" className="mt-6">Verify your email address before paying. <Link to="/verify-email" state={{ next: '/auction/payment' }} className="font-bold underline">Verify your email</Link></Alert>}

            {pending && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5" role="status">
                <p className="font-bold text-blue-900">Waiting for confirmation</p>
                <p className="text-sm text-blue-800 mt-1">We received your transfer details (transaction {payment.bankReference}). An administrator will confirm the payment, after which your membership is activated and your invoice is issued. You can leave this page.</p>
                <Link to="/account/payments" className="inline-block mt-3 text-sm font-bold text-blue-700 underline">View my payments</Link>
              </div>
            )}

            {ready && !pending && (
              <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
                <fieldset>
                  <legend className="text-sm font-bold text-gray-700 mb-2">Payment method</legend>
                  <div className="grid sm:grid-cols-3 gap-2" role="radiogroup">
                    {methods.methods.map(item => {
                      const Icon = METHOD_ICONS[item.id] || CreditCard
                      const selected = method === item.id
                      return (
                        <label key={item.id} className={`cursor-pointer rounded-xl border p-3 text-center text-xs font-bold transition-colors focus-within:ring-4 focus-within:ring-blue-200 ${selected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                          <input type="radio" name="payment-method" value={item.id} checked={selected} onChange={() => { setMethod(item.id); setFieldErrors({}); setFailure('') }} className="sr-only" />
                          <Icon className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />{item.label}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                {failure && <Alert tone="error">{failure}</Alert>}

                {method === 'card' && (
                  <div className="space-y-4">
                    <FormField label="Name on card" htmlFor="card-name" error={fieldErrors.cardName} required><Input id="card-name" autoComplete="cc-name" value={card.name} error={fieldErrors.cardName} onChange={event => setCard(current => ({ ...current, name: event.target.value }))} /></FormField>
                    <FormField label="Card number" htmlFor="card-number" error={fieldErrors.cardNumber} hint={cardBrand(onlyDigits(card.number)) || undefined} required><Input id="card-number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={card.number} error={fieldErrors.cardNumber} onChange={event => setCard(current => ({ ...current, number: formatCardNumber(event.target.value) }))} /></FormField>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Expiry (MM / YY)" htmlFor="card-expiry" error={fieldErrors.expiry} required><Input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" maxLength={7} value={card.expiry} error={fieldErrors.expiry} onChange={event => setCard(current => ({ ...current, expiry: formatExpiry(event.target.value) }))} /></FormField>
                      <FormField label="Security code" htmlFor="card-cvc" error={fieldErrors.cvc} required><Input id="card-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={card.cvc} error={fieldErrors.cvc} onChange={event => setCard(current => ({ ...current, cvc: onlyDigits(event.target.value).slice(0, 4) }))} /></FormField>
                    </div>
                    <p className="text-xs text-gray-500">{methods.methods.find(item => item.id === 'card')?.testHint}</p>
                  </div>
                )}

                {method === 'wallet' && (
                  <div className="space-y-4">
                    <FormField label="Wallet" htmlFor="wallet-provider" error={fieldErrors.walletProvider} required>
                      <Select id="wallet-provider" value={wallet.provider} error={fieldErrors.walletProvider} onChange={event => setWallet(current => ({ ...current, provider: event.target.value }))}>
                        {methods.wallets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </Select>
                    </FormField>
                    <FormField label="Wallet mobile number" htmlFor="wallet-number" error={fieldErrors.walletNumber} required><Input id="wallet-number" inputMode="numeric" autoComplete="tel" placeholder="03001234567" value={wallet.number} error={fieldErrors.walletNumber} onChange={event => setWallet(current => ({ ...current, number: formatMobile(event.target.value) }))} /></FormField>
                    <p className="text-xs text-gray-500">{methods.methods.find(item => item.id === 'wallet')?.testHint}</p>
                  </div>
                )}

                {method === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm" aria-label="Bank details">
                      <p className="font-bold text-gray-900">Transfer {formatMoney(plan.amount, plan.currency)} to</p>
                      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-gray-700">
                        <dt className="text-gray-500">Bank</dt><dd>{methods.bank.bankName}</dd>
                        <dt className="text-gray-500">Account title</dt><dd>{methods.bank.accountTitle}</dd>
                        <dt className="text-gray-500">IBAN</dt><dd className="font-mono">{methods.bank.iban}</dd>
                        <dt className="text-gray-500">Reference</dt><dd className="font-mono">{payment.reference}</dd>
                      </dl>
                    </div>
                    <FormField label="Transaction ID from your bank" htmlFor="bank-reference" error={fieldErrors.bankReference} required><Input id="bank-reference" autoComplete="off" value={transfer.reference} error={fieldErrors.bankReference} onChange={event => setTransfer(current => ({ ...current, reference: event.target.value }))} /></FormField>
                    <FormField label="Date of transfer" htmlFor="bank-date" error={fieldErrors.transferDate} required><Input id="bank-date" type="date" max={today()} value={transfer.date} error={fieldErrors.transferDate} onChange={event => setTransfer(current => ({ ...current, date: event.target.value }))} /></FormField>
                    <p className="text-xs text-gray-500">{methods.methods.find(item => item.id === 'bank_transfer')?.testHint}</p>
                  </div>
                )}

                <Button type="submit" loading={submitting} className="w-full py-3.5">{method === 'bank_transfer' ? 'Submit transfer details' : `Pay ${formatMoney(plan.amount, plan.currency)}`}</Button>
              </form>
            )}

            <Link to="/account" className="block mt-6 text-center text-sm font-bold text-blue-700 hover:underline">My Account</Link>
            <Link to="/auction" className="block mt-3 text-center text-sm font-bold text-blue-700 hover:underline">Back to Auctions</Link>
          </section>
        </div>
      </div>
    </div>
  )
}
