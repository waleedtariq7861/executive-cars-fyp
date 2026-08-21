import React, { useEffect, useState } from 'react'
import { Car } from 'lucide-react'

export default function VehicleImage({ src, alt, className = '', fallbackClassName = '' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) return <div role="img" aria-label={`${alt} image unavailable`} className={`bg-slate-100 flex items-center justify-center text-slate-300 ${fallbackClassName || className}`}><Car className="w-12 h-12" /></div>
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
}
