import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Button from './Button.jsx'

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow }
  }, [open, onClose])
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close dialog" /><div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`relative w-full ${widths[size]} max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl`}><div className="sticky top-0 z-10 bg-white flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100"><div><h2 id="dialog-title" className="font-black text-gray-900">{title}</h2>{description && <p className="text-xs text-gray-500 mt-1">{description}</p>}</div><button ref={closeRef} type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button></div><div className="p-5">{children}</div>{footer && <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}</div></div>
}

export function Drawer({ open, onClose, title, children, side = 'right' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return <div className={`fixed inset-0 z-[75] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}><button type="button" onClick={onClose} aria-label="Close drawer" className={`absolute inset-0 bg-slate-950/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} /><aside role="dialog" aria-modal="true" aria-label={title} className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-[min(90vw,390px)] bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full'}`}><div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"><h2 className="font-black text-gray-900">{title}</h2><button type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-gray-100 inline-flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button></div><div className="h-[calc(100%-65px)] overflow-y-auto p-5">{children}</div></aside></div>
}

export function ConfirmationDialog({ open, onClose, onConfirm, title = 'Confirm action', description, confirmLabel = 'Confirm', dangerous = false, loading = false }) {
  return <Modal open={open} onClose={onClose} title={title} description={description} size="sm" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={dangerous ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}><p className="text-sm text-gray-600 leading-6">Please review this action before continuing.</p></Modal>
}
