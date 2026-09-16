import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button.jsx'

const focusableSelector = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useDialogLifecycle(open, onClose, dialogRef, initialFocusRef, restoreFocusRef) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const overlay = dialogRef.current?.parentElement
    const backgroundState = [...document.body.children]
      .filter(element => element !== overlay)
      .map(element => ({ element, inert: element.inert, ariaHidden: element.getAttribute('aria-hidden') }))

    document.body.style.overflow = 'hidden'
    backgroundState.forEach(({ element }) => {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    })

    const focusInitial = () => {
      const fallback = dialogRef.current?.querySelector(focusableSelector)
      ;(initialFocusRef?.current || fallback || dialogRef.current)?.focus()
    }
    const frame = window.requestAnimationFrame(focusInitial)

    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll(focusableSelector)]
        .filter(element => {
          const style = window.getComputedStyle(element)
          return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden'
        })
      if (!focusable.length) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      backgroundState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert
        if (ariaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', ariaHidden)
      })
      const restoreTarget = restoreFocusRef?.current || previousFocus
      if (restoreTarget instanceof HTMLElement) window.requestAnimationFrame(() => restoreTarget.focus())
    }
  }, [open, dialogRef, initialFocusRef, restoreFocusRef])
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  useDialogLifecycle(open, onClose, dialogRef, closeRef)
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Close dialog" tabIndex={-1} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={`relative w-full ${widths[size]} max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl`}>
        <div className="sticky top-0 z-10 bg-white flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div><h2 id={titleId} className="font-black text-gray-900">{title}</h2>{description && <p id={descriptionId} className="text-xs text-gray-500 mt-1">{description}</p>}</div>
          <button ref={closeRef} type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({ open, onClose, title, description, children, side = 'right' }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  useDialogLifecycle(open, onClose, dialogRef, closeRef)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[75]">
      <button type="button" onClick={onClose} aria-label="Close drawer" tabIndex={-1} className="absolute inset-0 bg-slate-950/50" />
      <aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-[min(92vw,440px)] bg-white shadow-2xl animate-fadeInRight`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div><h2 id={titleId} className="font-black text-gray-900">{title}</h2>{description && <p id={descriptionId} className="text-xs text-gray-500 mt-1">{description}</p>}</div>
          <button ref={closeRef} type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-y-auto p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}

export function ConfirmationDialog({ open, onClose, onConfirm, title = 'Confirm action', description, confirmLabel = 'Confirm', dangerous = false, loading = false }) {
  return <Modal open={open} onClose={onClose} title={title} description={description} size="sm" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={dangerous ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}><p className="text-sm text-gray-600 leading-6">Please review this action before continuing.</p></Modal>
}
