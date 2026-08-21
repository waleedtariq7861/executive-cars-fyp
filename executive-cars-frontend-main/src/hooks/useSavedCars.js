import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api.js'
import { useAuth } from '../context/authContext.js'

const STORAGE_KEY = 'ec_wishlist'

function readLocalIds() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value.filter(Boolean) : []
  } catch {
    return []
  }
}

function storeLocalIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useSavedCars() {
  const { user } = useAuth()
  const serverBacked = user?.role === 'user'
  const [savedIds, setSavedIds] = useState(() => serverBacked ? [] : readLocalIds())
  const [savedCars, setSavedCars] = useState([])
  const [syncing, setSyncing] = useState(serverBacked)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setError('')
    if (!serverBacked) {
      const localIds = readLocalIds()
      setSavedIds(localIds)
      setSavedCars([])
      setSyncing(false)
      return []
    }

    setSyncing(true)
    try {
      const { data } = await api.get('/member/saved-cars')
      const cars = Array.isArray(data?.cars) ? data.cars : []
      const ids = cars.map(car => car._id)
      setSavedCars(cars)
      setSavedIds(ids)
      return cars
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Saved cars could not be synchronised.')
      throw requestError
    } finally {
      setSyncing(false)
    }
  }, [serverBacked])

  useEffect(() => {
    reload().catch(() => {})
  }, [reload])

  const toggleSaved = useCallback(async (id) => {
    const wasSaved = savedIds.includes(id)
    const previousIds = savedIds
    const previousCars = savedCars
    const nextIds = wasSaved ? savedIds.filter(item => item !== id) : [...savedIds, id]
    setSavedIds(nextIds)
    if (!serverBacked) storeLocalIds(nextIds)
    if (wasSaved) setSavedCars(current => current.filter(car => car._id !== id))

    if (!serverBacked) return !wasSaved

    try {
      const { data } = wasSaved
        ? await api.delete(`/member/saved-cars/${id}`)
        : await api.post(`/member/saved-cars/${id}`)
      if (!wasSaved && data?.car) setSavedCars(current => [data.car, ...current.filter(car => car._id !== id)])
      setError('')
      return !wasSaved
    } catch (requestError) {
      setSavedIds(previousIds)
      setSavedCars(previousCars)
      if (!serverBacked) storeLocalIds(previousIds)
      const message = requestError.response?.data?.message || 'Saved car could not be updated.'
      setError(message)
      throw new Error(message)
    }
  }, [savedCars, savedIds, serverBacked])

  return useMemo(() => ({
    savedIds,
    savedCars,
    syncing,
    error,
    serverBacked,
    reload,
    toggleSaved,
  }), [error, reload, savedCars, savedIds, serverBacked, syncing, toggleSaved])
}
