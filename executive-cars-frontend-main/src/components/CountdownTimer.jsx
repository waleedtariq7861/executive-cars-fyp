// src/components/CountdownTimer.jsx
import React, { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

export default function CountdownTimer({ endsIn, showDays = false, className = '' }) {
  const [time, setTime] = useState(endsIn)

  const isUrgent = showDays
    ? time.d === 0 && time.h === 0 && time.m < 10
    : time.h === 0 && time.m < 60

  useEffect(() => {
    setTime(endsIn)
    const t = setInterval(() => {
      setTime(prev => {
        let { d = 0, h, m, s } = prev
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) {
          if (showDays) { h = 23; d-- }
          else { return { h: 0, m: 0, s: 0 } }
        }
        if (showDays && d < 0) return { d: 0, h: 0, m: 0, s: 0 }
        return showDays ? { d, h, m, s } : { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [endsIn, showDays])

  const pad = n => String(n).padStart(2, '0')

  if (showDays) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {[{ v: time.d ?? 0, l: 'Days' }, { v: time.h, l: 'Hrs' }, { v: time.m, l: 'Min' }, { v: time.s, l: 'Sec' }].map(({ v, l }) => (
          <div key={l} className="text-center">
            <div className={`rounded-xl px-3 py-2 font-black text-xl font-mono min-w-[52px] ${
              isUrgent ? 'bg-red-50 border border-red-300 text-red-600' : 'bg-gray-100 border border-gray-200 text-gray-900'
            }`}>{pad(v)}</div>
            <div className="text-xs text-gray-400 mt-1">{l}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 text-xs font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'} ${className}`}>
      <Timer className="w-3 h-3" />
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </div>
  )
}
