import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import api from '../../api/api.js'
import ActivityList from '../../components/auth/ActivityList.jsx'
import ChangePasswordForm from '../../components/auth/ChangePasswordForm.jsx'
import MfaPanel from '../../components/auth/MfaPanel.jsx'
import SessionsPanel from '../../components/auth/SessionsPanel.jsx'
import { Alert } from '../../components/ui/Feedback.jsx'
import { FormField, Select } from '../../components/ui/FormControls.jsx'
import { readApiError } from '../../utils/apiError.js'
import { ADMIN_FILTERS, NEEDS_ATTENTION, eventLabel, formatWhen } from '../../utils/authEvents.js'

const Section = ({ title, description, children }) => (
  <section className="bg-white border border-gray-200 rounded-xl p-6">
    <h2 className="font-black text-gray-900">{title}</h2>
    {description && <p className="text-sm text-gray-500 mt-1 mb-5">{description}</p>}
    {children}
  </section>
)

const Tile = ({ label, value, warn }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 text-2xl font-black ${warn && value > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p></div>
)

export default function AdminSecurityPage() {
  const [filter, setFilter] = useState('')
  const [state, setState] = useState({ status: 'loading', events: [], summary: null, message: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    api.get('/admin/auth-events', { params: filter ? { type: filter } : {} })
      .then(({ data }) => setState({ status: 'ready', events: data.events, summary: data.summary, message: '' }))
      .catch(error => setState({ status: 'error', events: [], summary: null, message: readApiError(error, 'The security events could not be loaded.').message }))
  }, [filter, attempt])

  const { summary } = state

  return (
    <AdminLayout title="Security">
      <div className="space-y-6">
        {summary && (
          <div className="grid sm:grid-cols-3 gap-4">
            <Tile label="Failed sign-ins (24 h)" value={summary.loginFailures24h} warn />
            <Tile label="Emails not delivered (24 h)" value={summary.mailFailures24h} warn />
            <Tile label="Password reset requests (24 h)" value={summary.resetRequests24h} />
          </div>
        )}
        {summary?.mailFailures24h > 0 && (
          <Alert tone="warning" title="Some security emails did not reach customers">
            Password reset codes, verification codes or notices failed to send. Check the email provider settings (Resend) and its activity log.
          </Alert>
        )}

        <Section title="Account activity" description="Sign-ins, failed attempts, password changes and resets across all accounts. Emails are shown masked unless the account still exists.">
          <FormField label="Show" htmlFor="auth-event-filter" className="w-60 mb-4">
            <Select id="auth-event-filter" value={filter} onChange={event => { setState(current => ({ ...current, status: 'loading' })); setFilter(event.target.value) }}>
              {ADMIN_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          {state.status === 'loading' && <p role="status" className="text-sm text-gray-500">Loading events…</p>}
          {state.status === 'error' && <Alert tone="error">{state.message} <button type="button" onClick={() => { setState(current => ({ ...current, status: 'loading' })); setAttempt(value => value + 1) }} className="font-bold underline">Try again</button></Alert>}
          {state.status === 'ready' && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <caption className="sr-only">Account activity</caption>
                <thead><tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-4 py-3 font-bold">When</th><th scope="col" className="px-4 py-3 font-bold">Event</th><th scope="col" className="px-4 py-3 font-bold">Account</th><th scope="col" className="px-4 py-3 font-bold">From</th>
                </tr></thead>
                <tbody>
                  {state.events.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No events found</td></tr>}
                  {state.events.map(event => (
                    <tr key={event.id} className="border-b border-gray-100 align-top">
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatWhen(event.at)}</td>
                      <td className="px-4 py-3"><span className={`font-semibold ${NEEDS_ATTENTION.has(event.type) ? 'text-amber-700' : 'text-gray-900'}`}>{eventLabel(event.type)}</span>{event.detail && <span className="block text-xs text-gray-500">{event.detail}</span>}</td>
                      <td className="px-4 py-3">{event.account ? <><span className="font-semibold text-gray-900">{event.account.name}</span><span className="block text-xs text-gray-500 break-all">{event.account.email}</span><span className="block text-[10px] uppercase text-gray-400">{event.accountModel === 'admin' ? 'Administrator' : 'Customer'}</span></> : <span className="text-gray-500 break-all">{event.email || '—'}</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{[event.device, event.ip].filter(Boolean).join(' · ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Two-step sign-in" description="Protects the administrator account even if the password leaks."><MfaPanel /></Section>

        <div className="grid xl:grid-cols-2 gap-6">
          <Section title="Change your password" description="Changing it signs your other devices out."><ChangePasswordForm idPrefix="admin-password" /></Section>
          <Section title="Where you are signed in" description="Administrator sessions end after 30 minutes without activity."><SessionsPanel /></Section>
        </div>
        <Section title="Your recent activity"><ActivityList /></Section>
      </div>
    </AdminLayout>
  )
}
