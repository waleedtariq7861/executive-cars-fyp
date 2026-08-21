import React, { useCallback, useMemo, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { ToastContext } from '../../context/toastContext.js'

const icons = { success: CheckCircle2, error: TriangleAlert, info: Info }
const tones = { success: 'border-green-200 text-green-800', error: 'border-red-200 text-red-800', info: 'border-blue-200 text-blue-800' }

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback(id => setToasts(current => current.filter(item => item.id !== id)), [])
  const showToast = useCallback(({ title, message, tone = 'info', duration = 4000 }) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(current => [...current, { id, title, message, tone }])
    window.setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])
  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss])
  return <ToastContext.Provider value={value}>{children}<div aria-live="polite" aria-atomic="true" className="fixed top-4 right-4 z-[100] w-[min(92vw,380px)] space-y-2">{toasts.map(toast => { const Icon = icons[toast.tone] || Info; return <div key={toast.id} role="status" className={`bg-white border rounded-xl shadow-elevated p-4 flex gap-3 ${tones[toast.tone]}`}><Icon className="w-5 h-5 shrink-0" /><div className="flex-1"><p className="text-sm font-bold">{toast.title}</p>{toast.message && <p className="text-xs mt-1 opacity-80">{toast.message}</p>}</div><button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X className="w-4 h-4" /></button></div> })}</div></ToastContext.Provider>
}
