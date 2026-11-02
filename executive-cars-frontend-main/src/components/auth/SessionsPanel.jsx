import React, { useCallback, useEffect, useState } from 'react'
import { Laptop } from 'lucide-react'
import api from '../../api/api.js'
import Button from '../ui/Button.jsx'
import { Alert } from '../ui/Feedback.jsx'
import { readApiError } from '../../utils/apiError.js'
import { formatWhen } from '../../utils/authEvents.js'

// The devices this account is signed in on. Any other device can be signed out from here; this one uses "Sign out".
export default function SessionsPanel() {
  const [state, setState] = useState({ status: 'loading', sessions: [], message: '' })
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(() => {
    api.get('/auth/sessions')
      .then(({ data }) => setState({ status: 'ready', sessions: data.sessions, message: '' }))
      .catch(error => setState({ status: 'error', sessions: [], message: readApiError(error, 'Your sessions could not be loaded.').message }))
  }, [])

  useEffect(() => { load() }, [load, attempt])

  const act = async (key, request, done) => {
    if (busy) return
    setBusy(key); setNotice('')
    try {
      const { data } = await request()
      setNotice(done(data))
      load()
    } catch (error) {
      setNotice(readApiError(error, 'That could not be done. Please try again.').message)
    } finally {
      setBusy('')
    }
  }

  const others = state.sessions.filter(item => !item.current)

  return (
    <div>
      {notice && <Alert tone="info" className="mb-4">{notice}</Alert>}
      {state.status === 'loading' && <p role="status" className="text-sm text-gray-500">Loading your sessions…</p>}
      {state.status === 'error' && <Alert tone="error">{state.message} <button type="button" onClick={() => { setState(current => ({ ...current, status: 'loading' })); setAttempt(value => value + 1) }} className="font-bold underline">Try again</button></Alert>}
      {state.status === 'ready' && (
        <>
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
            {state.sessions.map(item => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Laptop className="w-5 h-5 text-gray-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.device}{item.current && <span className="ml-2 text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">This device</span>}</p>
                  <p className="text-xs text-gray-500">{item.ip ? `${item.ip} · ` : ''}Signed in {formatWhen(item.signedInAt)} · Last active {formatWhen(item.lastSeenAt)}</p>
                </div>
                {!item.current && (
                  <Button size="sm" variant="outline" loading={busy === item.id} onClick={() => act(item.id, () => api.delete(`/auth/sessions/${item.id}`), () => 'That device was signed out.')} aria-label={`Sign out ${item.device} last active ${formatWhen(item.lastSeenAt)}`}>Sign out</Button>
                )}
              </li>
            ))}
          </ul>
          {others.length > 0 && (
            <Button className="mt-4" variant="outline" loading={busy === 'all'} onClick={() => act('all', () => api.post('/auth/sessions/revoke-others'), data => `Signed out ${data.revoked} other ${data.revoked === 1 ? 'device' : 'devices'}.`)}>Sign out all other devices</Button>
          )}
        </>
      )}
    </div>
  )
}
