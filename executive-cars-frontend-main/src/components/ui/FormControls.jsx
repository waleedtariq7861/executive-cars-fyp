import React, { createContext, forwardRef, useContext, useId } from 'react'

const FormFieldContext = createContext(null)

export function FormField({ label, htmlFor, hint, error, required, children, className = '' }) {
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined
  return <FormFieldContext.Provider value={{ describedBy: errorId || hintId, errorMessage: errorId }}><div className={className}><label htmlFor={htmlFor} className="block text-xs font-bold text-gray-700 mb-2">{label}{required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}</label>{children}{hintId && <p id={hintId} className="text-xs text-gray-500 mt-1.5">{hint}</p>}{errorId && <p id={errorId} className="text-xs text-red-600 mt-1.5" role="alert">{error}</p>}</div></FormFieldContext.Provider>
}

const controlClass = 'w-full min-h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400'
const describedByProps = (field, describedBy, errorMessage) => ({
  'aria-describedby': [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
  'aria-errormessage': errorMessage || field?.errorMessage || undefined,
})
export const Input = forwardRef(function Input({ error, className = '', 'aria-describedby': describedBy, 'aria-errormessage': errorMessage, ...props }, ref) { const field = useContext(FormFieldContext); return <input ref={ref} aria-invalid={Boolean(error)} {...describedByProps(field, describedBy, errorMessage)} className={`${controlClass} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`} {...props} /> })
export const Select = forwardRef(function Select({ error, className = '', children, 'aria-describedby': describedBy, 'aria-errormessage': errorMessage, ...props }, ref) { const field = useContext(FormFieldContext); return <select ref={ref} aria-invalid={Boolean(error)} {...describedByProps(field, describedBy, errorMessage)} className={`${controlClass} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`} {...props}>{children}</select> })
export const Textarea = forwardRef(function Textarea({ error, className = '', 'aria-describedby': describedBy, 'aria-errormessage': errorMessage, ...props }, ref) { const field = useContext(FormFieldContext); return <textarea ref={ref} aria-invalid={Boolean(error)} {...describedByProps(field, describedBy, errorMessage)} className={`${controlClass} min-h-28 py-3 resize-y ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`} {...props} /> })

export function Checkbox({ label, description, className = '', ...props }) {
  const id = useId()
  return <label htmlFor={id} className={`flex items-start gap-3 cursor-pointer ${className}`}><input id={id} type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-blue-600" {...props} /><span><span className="block text-sm font-semibold text-gray-800">{label}</span>{description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}</span></label>
}

export function Radio({ label, className = '', ...props }) {
  const id = useId()
  return <label htmlFor={id} className={`inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 ${className}`}><input id={id} type="radio" className="w-4 h-4 accent-blue-600" {...props} />{label}</label>
}

export function Toggle({ checked, onChange, label, disabled = false }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-blue-100 ${checked ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-50`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} /></button>
}
