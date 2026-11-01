import { useCallback, useEffect, useState } from 'react'

// Counts down the seconds the server asked the person to wait before trying again (after too many failed
// sign-ins or reset requests). `waiting` is true until it reaches zero.
export default function useRetryCountdown() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = setTimeout(() => setSeconds(current => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  const start = useCallback(value => setSeconds(Math.max(0, Math.ceil(Number(value) || 0))), [])
  return { seconds, waiting: seconds > 0, start }
}
