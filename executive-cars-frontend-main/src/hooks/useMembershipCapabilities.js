import { useCallback, useEffect, useState } from 'react'
import api from '../api/api.js'

export default function useMembershipCapabilities(enabled = true) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setState({ status: 'loading', data: null })
    setAttempt(value => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let current = true
    api.get('/payments/capabilities').then(({ data }) => {
      if (!['demo', 'unavailable'].includes(data?.activationMode) ||
        !Number.isInteger(data.amount) || data.amount <= 0 || data.currency !== 'PKR' ||
        !Number.isInteger(data.durationYears) || data.durationYears <= 0) {
        throw new Error('Invalid membership capabilities')
      }
      if (current) setState({ status: data.activationMode, data })
    }).catch(() => {
      if (current) setState({ status: 'error', data: null })
    })
    return () => { current = false }
  }, [enabled, attempt])

  return { ...state, available: state.status === 'demo', retry }
}

export const membershipPriceLabel = data => data ? `${data.currency} ${data.amount.toLocaleString('en-PK')}` : '—'
