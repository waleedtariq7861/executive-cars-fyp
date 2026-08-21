import React from 'react'
import { Link } from 'react-router-dom'
import { Fuel, Gauge, Heart, MapPin, Settings, ShieldCheck } from 'lucide-react'
import VehicleImage from './VehicleImage.jsx'
import { formatPKR } from '../utils/format.js'

export default function VehicleCard({ car, saved = false, onSave, compact = false }) {
  const verified = car.verificationStatus === 'verified'
  const hasReport = car.inspectionStatus === 'report_available' || Boolean(car.pdfUrl)
  return <article className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-card hover:shadow-elevated hover:border-blue-200 transition-all">
    <div className={`relative overflow-hidden ${compact ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
      <Link to={`/used-cars/${car._id}`} className="block h-full"><VehicleImage src={car.images?.[0]} alt={`${car.make} ${car.model} ${car.year}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackClassName="w-full h-full" /></Link>
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">{verified && <span className="inline-flex items-center gap-1 bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded"><ShieldCheck className="w-3 h-3" /> VERIFIED</span>}{hasReport && <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded">REPORT</span>}</div>
      {onSave && <button type="button" onClick={() => onSave(car._id)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow inline-flex items-center justify-center hover:bg-red-50" aria-label={saved ? 'Remove from saved cars' : 'Save car'}><Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} /></button>}
    </div>
    <div className="p-4">
      <Link to={`/used-cars/${car._id}`} className="block"><h3 className="font-black text-gray-900 group-hover:text-blue-700 truncate">{car.make} {car.model} {car.year}</h3>{car.variant && <p className="text-xs text-gray-500 mt-1 truncate">{car.variant}</p>}</Link>
      <p className="font-black text-blue-700 text-lg mt-2">PKR {formatPKR(car.price)}</p>
      <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-2"><MapPin className="w-3 h-3" />{car.city || 'Location not provided'}</p>
      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-gray-500 mt-3 pt-3 border-t border-gray-100"><span className="flex items-center gap-1 truncate"><Gauge className="w-3 h-3" />{Number(car.km || 0).toLocaleString()} km</span><span className="flex items-center gap-1 truncate"><Fuel className="w-3 h-3" />{car.fuel || '—'}</span><span className="flex items-center gap-1 truncate"><Settings className="w-3 h-3" />{car.transmission || '—'}</span></div>
    </div>
  </article>
}
