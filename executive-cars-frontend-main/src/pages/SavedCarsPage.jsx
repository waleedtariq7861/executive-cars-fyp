import React, { useCallback, useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import VehicleCard from '../components/VehicleCard.jsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx'
import api from '../api/api.js'
import { useSavedCars } from '../hooks/useSavedCars.js'
import { useToast } from '../context/toastContext.js'

export default function SavedCarsPage() {
  const { showToast } = useToast()
  const {
    savedIds,
    savedCars,
    syncing,
    error: syncError,
    serverBacked,
    reload: reloadSaved,
    toggleSaved,
  } = useSavedCars()
  const [guestCars, setGuestCars] = useState([])
  const [guestLoading, setGuestLoading] = useState(!serverBacked)
  const [guestError, setGuestError] = useState('')

  const loadGuestCars = useCallback(async () => {
    if (serverBacked) return
    setGuestLoading(true)
    setGuestError('')
    try {
      const { data } = await api.get('/products')
      const allCars = Array.isArray(data) ? data : []
      setGuestCars(allCars.filter(car => savedIds.includes(car._id)))
    } catch (requestError) {
      setGuestError(requestError.response?.data?.message || 'Saved cars could not be loaded.')
    } finally {
      setGuestLoading(false)
    }
  }, [savedIds, serverBacked])

  useEffect(() => {
    loadGuestCars()
  }, [loadGuestCars])

  const toggleSave = async (id) => {
    try {
      await toggleSaved(id)
      if (!serverBacked) setGuestCars(current => current.filter(car => car._id !== id))
      showToast({ tone: 'success', title: 'Car removed', message: 'The listing was removed from your shortlist.' })
    } catch (requestError) {
      showToast({ tone: 'error', title: 'Could not update saved cars', message: requestError.message })
    }
  }

  const cars = serverBacked ? savedCars : guestCars
  const loading = serverBacked ? syncing : guestLoading
  const error = serverBacked ? syncError : guestError
  const retry = serverBacked ? reloadSaved : loadGuestCars

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="market-shell pt-[116px] md:pt-[140px] pb-16">
        <div className="mb-7">
          <p className="eyebrow">Your shortlist</p>
          <h1 className="text-3xl font-black text-gray-900 mt-2">Saved Cars</h1>
          <p className="text-sm text-gray-500 mt-2">
            {serverBacked ? 'Saved cars are securely linked to your Executive Cars account.' : 'Sign in to synchronise saved cars across devices. Guest saves remain in this browser.'}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-label="Loading saved cars">
            {[1, 2, 3, 4].map(item => <Skeleton key={item} className="h-80" />)}
          </div>
        ) : error ? (
          <div className="bg-white border border-gray-200 rounded-xl"><ErrorState description={error} onRetry={retry} /></div>
        ) : cars.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cars.map(car => <VehicleCard key={car._id} car={car} saved onSave={toggleSave} />)}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl">
            <EmptyState icon={Heart} title="No saved cars yet" description="Use the heart button on a marketplace listing to add it to this shortlist." />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
