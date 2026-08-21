import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Executive Cars — Used Cars, Valuation & Auctions',
  '/used-cars': 'Used Cars in Pakistan — Executive Cars',
  '/price-predictor': 'Car Price Predictor — Executive Cars',
  '/sell-car': 'Sell Your Car — Executive Cars',
  '/auction': 'Car Auctions — Executive Cars',
  '/login': 'Sign In — Executive Cars',
  '/forgot-password': 'Reset Password — Executive Cars',
  '/reset-password': 'Choose New Password — Executive Cars',
  '/seller/book-inspection': 'Book a Vehicle Inspection — Executive Cars',
  '/signup': 'Create Account — Executive Cars',
  '/privacy': 'Privacy Notice — Executive Cars',
  '/terms': 'Terms of Use — Executive Cars',
  '/saved-cars': 'Saved Cars — Executive Cars',
}

export default function RouteEffects() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    const exact = titles[location.pathname]
    const section = Object.entries(titles).find(([path]) => path !== '/' && location.pathname.startsWith(`${path}/`))?.[1]
    document.title = exact || section || 'Executive Cars'
  }, [location.pathname])
  return null
}
