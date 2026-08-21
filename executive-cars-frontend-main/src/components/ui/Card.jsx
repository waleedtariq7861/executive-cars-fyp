import React from 'react'

export function Card({ as: Component = 'section', className = '', children }) { return <Component className={`bg-white border border-gray-200 rounded-xl shadow-card ${className}`}>{children}</Component> }
export function CardHeader({ title, description, action, className = '' }) { return <div className={`flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100 ${className}`}><div><h2 className="font-bold text-gray-900">{title}</h2>{description && <p className="text-xs text-gray-500 mt-1">{description}</p>}</div>{action}</div> }
export function CardBody({ className = '', children }) { return <div className={`p-5 ${className}`}>{children}</div> }
