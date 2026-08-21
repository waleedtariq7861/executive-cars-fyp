import React from 'react'
import { Loader2 } from 'lucide-react'

const styles = {
  primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700',
  secondary: 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800',
  outline: 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50',
  ghost: 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700',
}
const sizes = { sm: 'min-h-9 px-3 text-xs', md: 'min-h-11 px-4 text-sm', lg: 'min-h-12 px-6 text-sm' }

export default function Button({ as: Component = 'button', variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }) {
  const buttonProps = Component === 'button' ? { type: props.type || 'button', disabled: disabled || loading } : { 'aria-disabled': disabled || loading }
  return <Component className={`inline-flex items-center justify-center gap-2 rounded-lg border font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-55 disabled:pointer-events-none ${styles[variant]} ${sizes[size]} ${className}`} {...props} {...buttonProps}>{loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}<span>{children}</span></Component>
}
