import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="w-20 h-20 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-black primary-text">404</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary px-8 py-3 rounded-xl font-semibold">
          Go Home
        </Link>
      </div>
      <Footer />
    </div>
  )
}
