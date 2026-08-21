import React, { useRef } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Dropdown({ label, children, align = 'right' }) {
  return <details className="relative group"><summary className="list-none cursor-pointer inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-blue-700 focus-visible:ring-4 focus-visible:ring-blue-100">{label}<ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" /></summary><div className={`absolute z-30 mt-2 min-w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-elevated origin-top animate-scaleIn ${align === 'right' ? 'right-0' : 'left-0'}`}>{children}</div></details>
}
export function DropdownItem({ to, icon: Icon, children }) { return <Link to={to} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700">{Icon && <Icon className="w-4 h-4" />}{children}</Link> }

export function Tabs({ items, value, onChange, label = 'Sections' }) {
  const refs = useRef([])
  const onKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'ArrowRight' ? (index + 1) % items.length : (index - 1 + items.length) % items.length
    onChange(items[next].value)
    refs.current[next]?.focus()
  }
  return <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-gray-200">{items.map((item, index) => <button key={item.value} ref={node => { refs.current[index] = node }} type="button" role="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)} onKeyDown={event => onKeyDown(event, index)} className={`shrink-0 px-4 py-3 text-sm font-bold border-b-2 ${value === item.value ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{item.label}</button>)}</div>
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(item => item === 1 || item === totalPages || Math.abs(item - page) <= 1)
  return <nav aria-label="Pagination" className="flex items-center justify-center gap-2"><button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="w-10 h-10 rounded-lg border border-gray-200 bg-white inline-flex items-center justify-center disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>{pages.map((item, index) => <React.Fragment key={item}>{index > 0 && item - pages[index - 1] > 1 && <span className="text-gray-400">…</span>}<button type="button" onClick={() => onPageChange(item)} aria-current={page === item ? 'page' : undefined} className={`w-10 h-10 rounded-lg text-sm font-bold ${page === item ? 'bg-blue-700 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}>{item}</button></React.Fragment>)}<button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="w-10 h-10 rounded-lg border border-gray-200 bg-white inline-flex items-center justify-center disabled:opacity-40" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button></nav>
}

export function Breadcrumbs({ items }) { return <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400 overflow-hidden">{items.map((item, index) => <React.Fragment key={item.label}>{index > 0 && <span>/</span>}{item.to ? <Link to={item.to} className="hover:text-blue-700 shrink-0">{item.label}</Link> : <span aria-current="page" className="truncate">{item.label}</span>}</React.Fragment>)}</nav> }
