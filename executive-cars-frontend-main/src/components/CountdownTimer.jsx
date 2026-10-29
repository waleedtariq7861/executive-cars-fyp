// src/components/CountdownTimer.jsx
import React, { useEffect, useRef, useState } from 'react'
import { Timer } from 'lucide-react'

const pad = n => String(n).padStart(2, '0')

function split(seconds) {
  return { d: Math.floor(seconds / 86400), h: Math.floor((seconds % 86400) / 3600), m: Math.floor((seconds % 3600) / 60), s: seconds % 60 }
}

// Counts down to an absolute `endsAt` instant, so it never drifts, survives
// re-renders, and tells the page (once) when the moment arrives.
export default function CountdownTimer({ endsAt, showDays = false, onEnd, className = '' }) {
  const target = new Date(endsAt).getTime()
  const secondsLeft = () => (Number.isFinite(target) ? Math.max(0, Math.ceil((target - Date.now()) / 1000)) : 0)
  const [remaining, setRemaining] = useState(secondsLeft)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    let finished = false
    const tick = () => {
      const left = Number.isFinite(target) ? Math.max(0, Math.ceil((target - Date.now()) / 1000)) : 0
      setRemaining(left)
      if (left === 0 && !finished) {
        finished = true
        onEndRef.current?.()
      }
      return left
    }
    if (tick() === 0) return undefined
    const timer = setInterval(() => { if (tick() === 0) clearInterval(timer) }, 1000)
    return () => clearInterval(timer)
  }, [target])

  const time = split(remaining)
  const label = showDays
    ? `${time.d} days ${time.h} hours ${time.m} minutes ${time.s} seconds remaining`
    : `${pad(time.h + time.d * 24)}:${pad(time.m)}:${pad(time.s)} remaining`

  if (showDays) {
    const isUrgent = time.d === 0 && time.h === 0 && time.m < 10
    return (
      <div role="timer" aria-label={label} className={`flex gap-2 ${className}`}>
        {[{ v: time.d, l: 'Days' }, { v: time.h, l: 'Hrs' }, { v: time.m, l: 'Min' }, { v: time.s, l: 'Sec' }].map(({ v, l }) => (
          <div key={l} className="text-center" aria-hidden="true">
            <div className={`rounded-xl px-3 py-2 font-black text-xl font-mono min-w-[52px] ${
              isUrgent ? 'bg-red-50 border border-red-300 text-red-600' : 'bg-gray-100 border border-gray-200 text-gray-900'
            }`}>{pad(v)}</div>
            <div className="text-xs text-gray-400 mt-1">{l}</div>
          </div>
        ))}
      </div>
    )
  }

  const hours = time.h + time.d * 24
  const isUrgent = hours === 0 && time.m < 60
  return (
    <div role="timer" aria-label={label} className={`flex items-center gap-1 text-xs font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'} ${className}`}>
      <Timer className="w-3 h-3" aria-hidden="true" />
      <span aria-hidden="true">{pad(hours)}:{pad(time.m)}:{pad(time.s)}</span>
    </div>
  )
}
