import React, { useEffect, useState } from 'react'
import api from '../../api/api.js'
import { Alert } from '../ui/Feedback.jsx'
import { readApiError } from '../../utils/apiError.js'
import { NEEDS_ATTENTION, eventLabel, formatWhen } from '../../utils/authEvents.js'

// Recent security events on the signed-in person's own account, so anything they did not do stands out.
export default function ActivityList() {
  const [state, setState] = useState({ status: 'loading', events: [], message: '' })

  useEffect(() => {
    api.get('/auth/activity')
      .then(({ data }) => setState({ status: 'ready', events: data.events, message: '' }))
      .catch(error => setState({ status: 'error', events: [], message: readApiError(error, 'Your recent activity could not be loaded.').message }))
  }, [])

  if (state.status === 'loading') return <p role="status" className="text-sm text-gray-500">Loading recent activity…</p>
  if (state.status === 'error') return <Alert tone="error">{state.message}</Alert>
  if (!state.events.length) return <p className="text-sm text-gray-500">Nothing has been recorded yet.</p>

  return (
    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
      {state.events.map(event => (
        <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
          <span className={`text-sm font-semibold ${NEEDS_ATTENTION.has(event.type) ? 'text-amber-700' : 'text-gray-900'}`}>{eventLabel(event.type)}</span>
          <span className="text-xs text-gray-500">{formatWhen(event.at)}</span>
          <span className="text-xs text-gray-400 sm:ml-auto">{[event.device, event.ip].filter(Boolean).join(' · ')}</span>
        </li>
      ))}
    </ul>
  )
}
