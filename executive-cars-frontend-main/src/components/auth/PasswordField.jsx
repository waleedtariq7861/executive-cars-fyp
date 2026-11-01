import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const TONES = { neutral: 'text-gray-500', warning: 'text-amber-700', good: 'text-green-700' }

// Password input with a show/hide toggle, an optional live hint and a field-level error.
// The error is announced and linked to the input so screen readers read it with the field.
export default function PasswordField({
  id, label, value, onChange, autoComplete = 'new-password', error, hint, hintTone = 'neutral',
  placeholder, required = true, maxLength, className = '',
}) {
  const [show, setShow] = useState(false)
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id} type={show ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)}
          autoComplete={autoComplete} placeholder={placeholder} required={required} maxLength={maxLength}
          aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy}
          className={`input-light pr-10 ${error ? 'border-red-400' : ''}`}
        />
        <button
          type="button" onClick={() => setShow(current => !current)}
          aria-label={`${show ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error
        ? <p id={errorId} role="alert" className="text-red-600 text-xs mt-1">{error}</p>
        : hint && <p id={hintId} className={`text-xs mt-1 ${TONES[hintTone] || TONES.neutral}`}>{hint}</p>}
    </div>
  )
}
