import React, { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ShieldCheck } from 'lucide-react'
import api from '../../api/api.js'
import Button from '../ui/Button.jsx'
import { Alert } from '../ui/Feedback.jsx'
import { FormField, Input } from '../ui/FormControls.jsx'
import PasswordField from './PasswordField.jsx'
import { readApiError } from '../../utils/apiError.js'
import { formatWhen } from '../../utils/authEvents.js'

const CODE_HINT = 'The 6-digit code from your authenticator app, or one of your recovery codes.'

// Two-step sign-in for administrators: an authenticator app (TOTP) plus single-use recovery codes.
export default function MfaPanel() {
  const [state, setState] = useState({ status: 'loading', mfa: null, message: '' })
  // null | { kind: 'password' } | { kind: 'scan', secret, otpauthUrl } | { kind: 'codes', codes } | { kind: 'disable' | 'regenerate' }
  const [flow, setFlow] = useState(null)
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(() => {
    api.get('/auth/mfa')
      .then(({ data }) => setState({ status: 'ready', mfa: data, message: '' }))
      .catch(error => setState({ status: 'error', mfa: null, message: readApiError(error, 'The two-step sign-in settings could not be loaded.').message }))
  }, [])

  useEffect(() => { load() }, [load, attempt])

  const finished = () => { setFlow(null); load() }

  if (state.status === 'loading') return <p role="status" className="text-sm text-gray-500">Loading…</p>
  if (state.status === 'error') return <Alert tone="error">{state.message} <button type="button" onClick={() => { setState({ status: 'loading', mfa: null, message: '' }); setAttempt(value => value + 1) }} className="font-bold underline">Try again</button></Alert>

  const { mfa } = state

  if (flow?.kind === 'codes') return <RecoveryCodes codes={flow.codes} onDone={finished} />
  if (flow?.kind === 'password') return <PasswordStep onCancel={() => setFlow(null)} onStarted={next => setFlow({ kind: 'scan', ...next })} />
  if (flow?.kind === 'scan') return <ScanStep secret={flow.secret} otpauthUrl={flow.otpauthUrl} onCancel={() => setFlow(null)} onEnabled={codes => setFlow({ kind: 'codes', codes })} />
  if (flow?.kind === 'disable' || flow?.kind === 'regenerate') {
    return <ReconfirmStep kind={flow.kind} onCancel={() => setFlow(null)} onDone={result => (flow.kind === 'regenerate' ? setFlow({ kind: 'codes', codes: result.recoveryCodes }) : finished())} />
  }

  return mfa.enabled ? (
    <div>
      <p className="text-sm text-gray-700 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" aria-hidden="true" /> <strong>On</strong> since {formatWhen(mfa.enabledAt)}. Signing in needs your password and a code from your authenticator app.</p>
      <p className="text-sm text-gray-500 mt-2">{mfa.recoveryCodesRemaining} unused recovery {mfa.recoveryCodesRemaining === 1 ? 'code' : 'codes'} left.{mfa.recoveryCodesRemaining <= 2 && ' Make new ones soon.'}</p>
      <div className="flex flex-wrap gap-3 mt-4">
        <Button variant="outline" onClick={() => setFlow({ kind: 'regenerate' })}>Make new recovery codes</Button>
        <Button variant="danger" onClick={() => setFlow({ kind: 'disable' })}>Turn off</Button>
      </div>
    </div>
  ) : (
    <div>
      <p className="text-sm text-gray-600">Off. Anyone who learns your password could sign in. Two-step sign-in adds a code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy and similar).</p>
      <Button className="mt-4" onClick={() => setFlow({ kind: 'password' })}>Turn on two-step sign-in</Button>
    </div>
  )
}

function useRequest() {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const run = async (request, onSuccess) => {
    if (busy) return
    setBusy(true); setErrors({})
    try {
      onSuccess((await request()).data)
    } catch (error) {
      const failure = readApiError(error, 'That did not work. Please try again.')
      setErrors(Object.keys(failure.fieldErrors).length ? failure.fieldErrors : { form: failure.message })
    } finally {
      setBusy(false)
    }
  }
  return { busy, errors, setErrors, run }
}

function PasswordStep({ onCancel, onStarted }) {
  const [password, setPassword] = useState('')
  const { busy, errors, setErrors, run } = useRequest()
  const submit = event => {
    event.preventDefault()
    if (!password) return setErrors({ password: 'Enter your password.' })
    run(() => api.post('/auth/mfa/setup', { password }), onStarted)
  }
  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm" noValidate>
      <p className="text-sm text-gray-600">Confirm your password to start.</p>
      {errors.form && <Alert tone="error">{errors.form}</Alert>}
      <PasswordField id="mfa-setup-password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} error={errors.password} maxLength={128} />
      <div className="flex gap-3"><Button type="submit" loading={busy}>Continue</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
    </form>
  )
}

function ScanStep({ secret, otpauthUrl, onCancel, onEnabled }) {
  const [image, setImage] = useState('')
  const [pictureFailed, setPictureFailed] = useState(false)
  const [code, setCode] = useState('')
  const { busy, errors, setErrors, run } = useRequest()

  useEffect(() => {
    let current = true
    QRCode.toDataURL(otpauthUrl, { margin: 1, width: 192 }).then(url => { if (current) setImage(url) }).catch(() => { if (current) setPictureFailed(true) })
    return () => { current = false }
  }, [otpauthUrl])

  const submit = event => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.replace(/\s+/g, ''))) return setErrors({ code: 'Enter the 6-digit code shown in your app.' })
    run(() => api.post('/auth/mfa/enable', { code }), data => onEnabled(data.recoveryCodes))
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm" noValidate>
      <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
        <li>Open your authenticator app and add an account.</li>
        <li>Scan this picture, or type the key below.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      {pictureFailed && <Alert tone="warning">The picture could not be made. Type the key below into your app instead.</Alert>}
      {image && <img src={image} alt="QR code to scan with your authenticator app" width="192" height="192" className="border border-gray-200 rounded-lg" />}
      <div><p className="text-xs text-gray-500">Key to type instead</p><p className="font-mono text-sm font-bold break-all select-all">{secret}</p></div>
      {errors.form && <Alert tone="error">{errors.form}</Alert>}
      <FormField label="6-digit code" htmlFor="mfa-enable-code" error={errors.code} required>
        <Input id="mfa-enable-code" value={code} error={errors.code} inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="123456"
          className="tracking-[0.4em] text-center text-lg font-bold" onChange={event => setCode(event.target.value.replace(/[^\d\s]/g, ''))} />
      </FormField>
      <div className="flex gap-3"><Button type="submit" loading={busy}>Turn on</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div>
    </form>
  )
}

function RecoveryCodes({ codes, onDone }) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState('')
  const copy = async () => {
    try { await navigator.clipboard.writeText(codes.join('\n')); setCopied('Copied.') } catch { setCopied('Could not copy: select the codes and copy them by hand.') }
  }
  return (
    <div className="max-w-sm">
      <Alert tone="warning" title="Save your recovery codes now">Each code signs you in once if you lose your phone. They are shown only this once.</Alert>
      <ul className="grid grid-cols-2 gap-2 my-4 font-mono text-sm font-bold" aria-label="Recovery codes">{codes.map(code => <li key={code} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center select-all">{code}</li>)}</ul>
      <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={copy}>Copy codes</Button>{copied && <span role="status" className="text-xs text-gray-600">{copied}</span>}</div>
      <label className="flex items-start gap-2 text-sm text-gray-700 mt-4"><input type="checkbox" checked={saved} onChange={event => setSaved(event.target.checked)} className="mt-1" /> I have saved these codes somewhere safe.</label>
      <Button className="mt-4" disabled={!saved} onClick={onDone}>Done</Button>
    </div>
  )
}

function ReconfirmStep({ kind, onCancel, onDone }) {
  const [form, setForm] = useState({ password: '', code: '' })
  const { busy, errors, setErrors, run } = useRequest()
  const regenerate = kind === 'regenerate'
  const submit = event => {
    event.preventDefault()
    if (!form.password) return setErrors({ password: 'Enter your password.' })
    if (!form.code.trim()) return setErrors({ code: 'Enter a code from your app or a recovery code.' })
    run(() => api.post(regenerate ? '/auth/mfa/recovery-codes' : '/auth/mfa/disable', form), onDone)
  }
  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm" noValidate>
      <p className="text-sm text-gray-600">{regenerate ? 'New codes replace the old ones, which stop working.' : 'Turning it off lets anyone with your password sign in. Your other devices will be signed out.'}</p>
      {errors.form && <Alert tone="error">{errors.form}</Alert>}
      <PasswordField id={`mfa-${kind}-password`} label="Password" autoComplete="current-password" value={form.password} onChange={value => setForm(current => ({ ...current, password: value }))} error={errors.password} maxLength={128} />
      <FormField label="Code" htmlFor={`mfa-${kind}-code`} hint={CODE_HINT} error={errors.code} required>
        <Input id={`mfa-${kind}-code`} value={form.code} error={errors.code} autoComplete="one-time-code" maxLength={14} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} />
      </FormField>
      <div className="flex gap-3">
        <Button type="submit" variant={regenerate ? 'primary' : 'danger'} loading={busy}>{regenerate ? 'Make new codes' : 'Turn off'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
