import React from 'react'
import { formatPKR } from '../../utils/format.js'

const badgeStyles = {
  neutral: 'bg-gray-100 text-gray-700 border-gray-200', blue: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200', warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
}
export function Badge({ tone = 'neutral', children, className = '' }) { return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeStyles[tone]} ${className}`}>{children}</span> }

const statusTones = { active: 'success', approved: 'success', available: 'success', live: 'success', pending: 'warning', scheduled: 'blue', ended: 'neutral', expired: 'error', rejected: 'error', cancelled: 'error', sold: 'neutral' }
export function StatusChip({ status, label }) { return <Badge tone={statusTones[status] || 'neutral'}><span className="capitalize">{label || String(status || 'unknown').replaceAll('_', ' ')}</span></Badge> }
export function PriceDisplay({ value, label, className = '' }) { return <div className={className}>{label && <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>}<p className="text-xl font-black text-blue-700 mt-0.5">PKR {formatPKR(Number(value || 0))}</p></div> }
export function SectionHeading({ eyebrow, title, description, action, align = 'left' }) { return <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${align === 'center' ? 'text-center items-center sm:items-center sm:flex-col' : ''}`}><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">{title}</h2>{description && <p className="text-sm text-gray-500 leading-6 mt-2 max-w-2xl">{description}</p>}</div>{action}</div> }
