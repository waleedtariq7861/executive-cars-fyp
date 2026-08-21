import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { if (import.meta.env.DEV) console.error('Application render error', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5"><section className="max-w-md bg-white border border-red-200 rounded-xl shadow-card p-7 text-center"><div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6 text-red-600" /></div><h1 className="text-xl font-black text-gray-900 mt-4">The page could not be displayed</h1><p className="text-sm text-gray-500 mt-2">Your data has not been submitted. Reload the page and try again.</p><button type="button" onClick={() => window.location.reload()} className="btn-primary px-5 py-3 text-sm mt-5">Reload application</button></section></main>
  }
}
