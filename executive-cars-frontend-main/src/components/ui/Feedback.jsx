import React from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import Button from './Button.jsx'

const tones = { info: 'bg-blue-50 border-blue-200 text-blue-800', success: 'bg-green-50 border-green-200 text-green-800', warning: 'bg-amber-50 border-amber-200 text-amber-800', error: 'bg-red-50 border-red-200 text-red-800' }
export function Alert({ tone = 'info', title, children, className = '' }) { return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-4 ${tones[tone]} ${className}`}><div className="flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /><div>{title && <p className="font-bold text-sm">{title}</p>}<div className="text-sm leading-6">{children}</div></div></div></div> }
export function Skeleton({ className = '' }) { return <div aria-hidden="true" className={`animate-pulse bg-gray-200 rounded-lg ${className}`} /> }
export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) { return <div className={`text-center px-5 py-14 ${className}`}><div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto"><Icon className="w-6 h-6 text-gray-400" /></div><h2 className="font-bold text-gray-900 mt-4">{title}</h2>{description && <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">{description}</p>}{action && <div className="mt-5">{action}</div>}</div> }
export function ErrorState({ title = 'Something went wrong', description, onRetry }) { return <EmptyState icon={AlertCircle} title={title} description={description} action={onRetry && <Button onClick={onRetry}><RefreshCw className="w-4 h-4" />Try again</Button>} /> }
