import { useCallback, useEffect, useState } from 'react'
import api from '../api/api.js'

// What the customer is buying and at what price, as the server states it.
export default function useMembershipPlan(enabled = true) {
  const [state, setState] = useState({ status: 'loading', plan: null })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setState({ status: 'loading', plan: null })
    setAttempt(value => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    let current = true
    api.get('/payments/plan').then(({ data }) => {
      if (!Number.isInteger(data?.amount) || data.amount <= 0 || data.currency !== 'PKR' || !data.name) throw new Error('Invalid membership plan')
      if (current) setState({ status: 'ready', plan: data })
    }).catch(() => { if (current) setState({ status: 'error', plan: null }) })
    return () => { current = false }
  }, [enabled, attempt])

  return { ...state, retry }
}
