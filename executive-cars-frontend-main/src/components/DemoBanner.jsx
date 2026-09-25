import React from 'react'

const visible = import.meta.env.VITE_APP_MODE === 'demo'

export default function DemoBanner() {
  if (!visible) return null
  return <div role="status" className="bg-amber-400 px-4 py-2 text-center text-xs font-black text-amber-950">
    Demonstration system — no real payment is processed
  </div>
}
