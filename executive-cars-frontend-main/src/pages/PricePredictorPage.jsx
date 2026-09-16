import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Info, Printer, RotateCcw, Save, Sparkles, TrendingUp,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import Button from '../components/ui/Button.jsx'
import { Alert, Skeleton } from '../components/ui/Feedback.jsx'
import { FormField, Input, Select } from '../components/ui/FormControls.jsx'
import { formatMarketPkr, formatPkr } from '../utils/format.js'
import { digitsOnly, numericInputProps } from '../utils/inputValidation.js'
import api from '../api/api.js'

const fallbackCities = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Faisalabad', 'Peshawar', 'Multan', 'Other']
const fallbackBodyTypes = ['Hatchback', 'Sedan', 'SUV', 'Crossover', 'Pickup', 'Van', 'Unknown']
const currentYear = new Date().getFullYear()
const initialForm = {
  make: '',
  model: '',
  variant: '',
  year: currentYear - 3,
  mileage: 30_000,
  engineCapacity: '',
  transmission: '',
  fuelType: '',
  city: 'Rawalpindi',
  registrationCity: 'Rawalpindi',
  condition: 'Good',
  assemblyType: '',
  bodyType: '',
}

const optionValues = (items, fallback) => {
  const values = (items || []).map(item => typeof item === 'string' ? item : item.value).filter(Boolean)
  return values.length ? values : fallback
}

const clientValidate = (form, requiresVerifiedVariant = false) => {
  const errors = {}
  if (!form.make) errors.make = 'Select a vehicle make.'
  if (!form.model) errors.model = 'Select a model for the chosen make.'
  if (!Number.isInteger(Number(form.year)) || Number(form.year) < 1980 || Number(form.year) > currentYear + 1) errors.year = 'Enter a valid model year.'
  if (requiresVerifiedVariant && !form.variant) errors.variant = 'Select a verified variant for this model year.'
  if (form.mileage === '' || !Number.isFinite(Number(form.mileage)) || Number(form.mileage) < 0 || Number(form.mileage) > 1_000_000) errors.mileage = 'Mileage must be between 0 and 1,000,000 km.'
  if (form.engineCapacity === '' || !Number.isFinite(Number(form.engineCapacity)) || Number(form.engineCapacity) < 300 || Number(form.engineCapacity) > 10_000) errors.engineCapacity = 'Engine capacity must be between 300 and 10,000 cc.'
  return errors
}

export default function PricePredictorPage() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [metadata, setMetadata] = useState(null)
  const [vehicleOptions, setVehicleOptions] = useState(null)
  const [metadataLoading, setMetadataLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get('/predict-price/options')
      .then(({ data }) => {
        if (active && data?.available) setMetadata(data)
      })
      .catch(() => {})
      .finally(() => { if (active) setMetadataLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const params = {}
    if (form.make) params.make = form.make
    if (form.model) params.model = form.model
    if (form.year) params.year = form.year
    api.get('/vehicle-options', { params }).then(({ data }) => setVehicleOptions(data)).catch(() => {})
  }, [form.make, form.model, form.year])

  const catalog = metadata?.inputCatalog
  const makes = vehicleOptions?.makes?.length ? vehicleOptions.makes : (catalog?.makes?.map(item => item.make) || [])
  const models = vehicleOptions?.models || []
  const years = vehicleOptions?.years || []
  const variants = vehicleOptions?.variants || []
  const variant = variants.find(item => item.name === form.variant)
  const identityReady = Boolean(form.make && form.model && form.year)
  const verifiedVehicle = vehicleOptions?.coverageLevel === 'verified'
  const variantRequired = verifiedVehicle && variants.length > 0
  const cities = optionValues(catalog?.listingCities, fallbackCities)
  const registrationCities = optionValues(catalog?.registrationCities, fallbackCities)
  const bodyTypes = optionValues(catalog?.bodyTypes, fallbackBodyTypes)
  const transmissions = optionValues(catalog?.transmissions, ['Auto', 'Manual'])
  const fuels = optionValues(catalog?.fuelTypes, ['Petrol', 'Diesel', 'CNG', 'Hybrid'])
  const assemblies = optionValues(catalog?.assemblyTypes, ['Local', 'Imported', 'Unknown'])
  const engineOptions = variant?.engineCapacity ? [variant.engineCapacity] : (vehicleOptions?.engines || [])
  const transmissionOptions = variant?.transmissions?.length ? variant.transmissions : (vehicleOptions?.transmissions?.length ? vehicleOptions.transmissions : transmissions)
  const fuelOptions = variant?.fuelTypes?.length ? variant.fuelTypes : (vehicleOptions?.fuels?.length ? vehicleOptions.fuels : fuels)
  const bodyOptions = variant?.bodyType ? [variant.bodyType] : (vehicleOptions?.bodyTypes?.length ? vehicleOptions.bodyTypes : bodyTypes)
  const assemblyOptions = variant?.assemblyTypes?.length ? variant.assemblyTypes : (vehicleOptions?.assemblies?.length ? vehicleOptions.assemblies : assemblies)

  useEffect(() => {
    if (!identityReady || variant) return
    const only = values => values?.length === 1 ? values[0] : ''
    const engine = only(vehicleOptions?.engines)
    const transmission = only(vehicleOptions?.transmissions)
    const fuelType = only(vehicleOptions?.fuels)
    const bodyType = only(vehicleOptions?.bodyTypes)
    const assemblyType = only(vehicleOptions?.assemblies)
    if (!(engine || transmission || fuelType || bodyType || assemblyType)) return
    setForm(current => ({
      ...current,
      engineCapacity: engine || current.engineCapacity,
      transmission: transmission || current.transmission,
      fuelType: fuelType || current.fuelType,
      bodyType: bodyType || current.bodyType,
      assemblyType: assemblyType || current.assemblyType,
    }))
  }, [identityReady, variant, vehicleOptions])

  const update = (key, value) => {
    setForm(current => ({ ...current, [key]: value }))
    setFieldErrors(current => ({ ...current, [key]: '' }))
  }

  const handlePredict = async event => {
    event.preventDefault()
    if (loading) return
    const validation = clientValidate(form, variantRequired)
    if (Object.keys(validation).length) {
      setFieldErrors(validation)
      setError('Please correct the highlighted vehicle details.')
      return
    }
    setLoading(true)
    setError('')
    setFieldErrors({})
    setSaved(false)
    try {
      const { data } = await api.post('/predict-price', {
        ...form,
        year: Number(form.year),
        mileage: Number(form.mileage),
        engineCapacity: Number(form.engineCapacity),
      }, { timeout: 12_000 })
      setResult(data)
    } catch (requestError) {
      setFieldErrors(requestError.response?.data?.errors || {})
      setError(
        requestError.code === 'ECONNABORTED'
          ? 'The valuation request timed out. Your details are still here; please try again.'
          : requestError.response?.data?.message || 'The valuation service is unavailable. Please try again later.',
      )
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm({ ...initialForm, year: currentYear - 3 })
    setResult(null)
    setError('')
    setFieldErrors({})
    setSaved(false)
  }

  const saveValuation = () => {
    if (!result) return
    const history = (() => {
      try { return JSON.parse(localStorage.getItem('ec_valuations') || '[]') } catch { return [] }
    })()
    const valuation = { id: Date.now(), vehicle: form, result, savedAt: new Date().toISOString() }
    localStorage.setItem('ec_valuations', JSON.stringify([valuation, ...history].slice(0, 10)))
    setSaved(true)
  }

  const estimate = result?.predicted_price ?? result?.estimatedPrice ?? result?.estimatedMarketPrice ?? result?.predicted
  const range = result?.recommendedRange || result?.range || { low: result?.lowerRange, high: result?.upperRange }
  const factors = result?.importantFactors || result?.mainPricingFactors || []
  const disclaimer = result?.isFallback
    ? 'Estimated from similar Executive Cars listings. Actual market value may vary based on condition and demand.'
    : 'Estimated from historical Pakistani used-car listing data. Actual market value may vary based on condition and demand.'

  return (
    <div className="min-h-screen bg-[var(--ec-background)]">
      <Navbar />
      <section className="relative bg-[var(--ec-navy)] pt-[68px] md:pt-[100px] overflow-hidden">
        <div className="absolute inset-0 surface-grid opacity-50" />
        <div className="market-shell relative py-12 lg:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200"><Sparkles className="w-4 h-4" /> Smart price guidance</span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3">Estimate your car’s market value</h1>
            <p className="text-blue-100/75 text-base sm:text-lg leading-7 mt-4 max-w-2xl">Tell us about your vehicle to receive an estimated market price, expected range, and the key factors that shape its value.</p>
          </div>
        </div>
      </section>

      <main className="market-shell py-8 lg:py-12">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_410px] gap-6 items-start max-w-6xl mx-auto">
          <section className="card overflow-hidden">
            <div className="px-5 sm:px-7 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-700" /></div>
              <div>
                <h2 className="font-black text-gray-900">Vehicle details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Complete the details below for a more useful estimate.</p>
              </div>
            </div>

            <form onSubmit={handlePredict} className="p-5 sm:p-7 space-y-7" noValidate>
              {error && <Alert tone="error">{error}</Alert>}
              {metadataLoading && <div className="grid sm:grid-cols-2 gap-5"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}

              <fieldset>
                <legend className="text-xs font-black uppercase tracking-[0.12em] text-gray-500 mb-4">Vehicle identity</legend>
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField label="Make" htmlFor="predict-make" required error={fieldErrors.make}>
                    <Select id="predict-make" value={form.make} error={fieldErrors.make} onChange={event => {
                      const make = event.target.value
                      setVehicleOptions(null)
                      setForm(current => ({ ...current, make, model: '', year: '', variant: '', engineCapacity: '', transmission: '', fuelType: '', bodyType: '', assemblyType: '' }))
                      setFieldErrors(current => ({ ...current, make: '' }))
                    }}>
                      <option value="">Select make</option>
                      {makes.map(make => <option key={make}>{make}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Model" htmlFor="predict-model" required error={fieldErrors.model} hint={!form.make ? 'Select a make first.' : models.length ? 'Choose the exact model.' : 'No models are available for this make.'}>
                    <Select id="predict-model" value={form.model} error={fieldErrors.model} disabled={!form.make || !models.length} onChange={event => {
                      const model = event.target.value
                      setVehicleOptions(null)
                      setForm(current => ({ ...current, model, year: '', variant: '', engineCapacity: '', transmission: '', fuelType: '', bodyType: '', assemblyType: '' }))
                      setFieldErrors(current => ({ ...current, model: '' }))
                    }}>
                      <option value="">Select model</option>
                      {models.map(model => <option key={model}>{model}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Model year" htmlFor="predict-year" required error={fieldErrors.year}>
                    <Select id="predict-year" required value={form.year} error={fieldErrors.year} disabled={!form.model} onChange={event => { setVehicleOptions(null); setForm(current => ({ ...current, year: Number(event.target.value), variant: '', engineCapacity: '', transmission: '', fuelType: '', bodyType: '', assemblyType: '' })) }}><option value="">Select year</option>{years.map(year => <option key={year}>{year}</option>)}</Select>
                  </FormField>
                  <FormField label={variantRequired ? 'Variant' : 'Variant (optional)'} htmlFor="predict-variant" required={variantRequired} error={fieldErrors.variant} hint={!form.year ? 'Select a model year first.' : (!variants.length ? 'Enter the variant if you know it.' : 'Choose the verified variant that matches the vehicle.')}>
                    {variants.length ? (
                      <Select id="predict-variant" required={variantRequired} value={form.variant} error={fieldErrors.variant} disabled={!form.year} onChange={event => { const next = variants.find(item => item.name === event.target.value); setForm(current => ({ ...current, variant: event.target.value, engineCapacity: next?.engineCapacity || '', transmission: next?.transmissions?.[0] || '', fuelType: next?.fuelTypes?.[0] || '', bodyType: next?.bodyType || '', assemblyType: next?.assemblyTypes?.[0] || '' })); setFieldErrors(current => ({ ...current, variant: '' })) }}><option value="">Select variant</option>{variants.map(item => <option key={item.name}>{item.name}</option>)}</Select>
                    ) : (
                      <Input id="predict-variant" value={form.variant} disabled={!identityReady} placeholder="e.g. VXR, VXL, GLi, Oriel" onChange={event => update('variant', event.target.value)} />
                    )}
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-black uppercase tracking-[0.12em] text-gray-500 mb-4">Vehicle specifications</legend>
                {!identityReady && <p className="text-sm text-gray-500 -mt-1 mb-4">Select a make, model, and year to view available specifications.</p>}
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField label="Engine (cc)" htmlFor="predict-engine" required error={fieldErrors.engineCapacity}>
                    {engineOptions.length ? (
                      <Select id="predict-engine" required value={form.engineCapacity} disabled={!identityReady || Boolean(variant?.engineCapacity)} error={fieldErrors.engineCapacity} onChange={event => update('engineCapacity', event.target.value)}><option value="">Select engine</option>{engineOptions.map(item => <option key={item} value={item}>{item} cc</option>)}</Select>
                    ) : (
                      <Input id="predict-engine" {...numericInputProps(5)} required disabled={!identityReady} value={form.engineCapacity} error={fieldErrors.engineCapacity} placeholder="e.g. 1300" onChange={event => update('engineCapacity', digitsOnly(event.target.value, 5))} />
                    )}
                  </FormField>
                  <FormField label="Transmission" htmlFor="predict-transmission">
                    <Select id="predict-transmission" value={form.transmission} disabled={!identityReady || Boolean(variant?.transmissions?.length)} onChange={event => update('transmission', event.target.value)}><option value="">Not specified</option>{transmissionOptions.map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                  <FormField label="Fuel type" htmlFor="predict-fuel">
                    <Select id="predict-fuel" value={form.fuelType} disabled={!identityReady || Boolean(variant?.fuelTypes?.length)} onChange={event => update('fuelType', event.target.value)}><option value="">Not specified</option>{fuelOptions.map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                  <FormField label="Body type" htmlFor="predict-body">
                    <Select id="predict-body" value={form.bodyType} disabled={!identityReady || Boolean(variant?.bodyType)} onChange={event => update('bodyType', event.target.value)}><option value="">Not specified</option>{bodyOptions.map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                  <FormField label="Assembly" htmlFor="predict-assembly">
                    <Select id="predict-assembly" value={form.assemblyType} disabled={!identityReady || Boolean(variant?.assemblyTypes?.length)} onChange={event => update('assemblyType', event.target.value)}><option value="">Not specified</option>{assemblyOptions.map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-black uppercase tracking-[0.12em] text-gray-500 mb-4">Vehicle usage &amp; location</legend>
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField label="Mileage (km)" htmlFor="predict-mileage" required error={fieldErrors.mileage}>
                    <Input id="predict-mileage" {...numericInputProps(7)} required value={form.mileage} error={fieldErrors.mileage} onChange={event => update('mileage', digitsOnly(event.target.value, 7))} />
                  </FormField>
                  <FormField label="Declared condition" htmlFor="predict-condition">
                    <Select id="predict-condition" value={form.condition} onChange={event => update('condition', event.target.value)}>{['Excellent', 'Good', 'Fair', 'Needs Work', 'Unknown'].map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                  <FormField label="Listing city" htmlFor="predict-city">
                    <Select id="predict-city" value={form.city} onChange={event => update('city', event.target.value)}>{cities.map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                  <FormField label="Registration city" htmlFor="predict-registration">
                    <Select id="predict-registration" value={form.registrationCity} onChange={event => update('registrationCity', event.target.value)}>{registrationCities.map(item => <option key={item}>{item}</option>)}</Select>
                  </FormField>
                </div>
              </fieldset>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={reset} disabled={loading}><RotateCcw className="w-4 h-4" /> Reset</Button>
                <Button type="submit" loading={loading} className="flex-1">{loading ? 'Generating valuation…' : <><Sparkles className="w-4 h-4" /> Generate valuation</>}</Button>
              </div>
            </form>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-[116px]">
            {result ? (
              <section className="bg-white border border-blue-200 rounded-xl shadow-elevated overflow-hidden animate-scaleIn print:shadow-none">
                <div className="bg-blue-950 px-5 py-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100/70">Expected Market Range</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1">{formatMarketPkr(range?.low)} – {formatMarketPkr(range?.high)}</p>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Estimated midpoint</p>
                  <p className="font-black text-gray-900 mt-1">{formatPkr(estimate)}</p>

                  {result.extrapolationWarnings?.length > 0 && <Alert tone="warning" className="mt-5">Some of these vehicle details are less common, so the final market value may vary more than usual.</Alert>}

                  {factors.length > 0 && <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Important Price Factors</p>
                    <ul className="space-y-2 mt-2">{factors.slice(0, 5).map((factor, index) => {
                      const label = typeof factor === 'string' ? factor : `${factor.label}: ${factor.value}`
                      return <li key={`${typeof factor === 'string' ? factor : factor.feature}-${index}`} className="flex gap-2 text-xs text-gray-600 leading-5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />{label}</li>
                    })}</ul>
                  </div>}

                  <div className="flex gap-2 mt-5 text-[11px] text-gray-500 leading-5"><Info className="w-4 h-4 shrink-0 mt-0.5" /><span>{disclaimer}</span></div>
                  <div className="grid grid-cols-2 gap-2 mt-5 print:hidden">
                    <Button type="button" variant="outline" size="sm" onClick={saveValuation}><Save className="w-4 h-4" />{saved ? 'Saved' : 'Save'}</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4" />Print</Button>
                  </div>
                  <Button as={Link} to="/sell-car" className="w-full mt-3 print:hidden">Sell this car <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </section>
            ) : (
              <section className="card p-5">
                <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-700" /></div>
                <h2 className="font-black text-gray-900 mt-4">Your valuation will appear here</h2>
                <p className="text-sm text-gray-500 leading-6 mt-2">Complete the vehicle form to see an estimated market price, expected range, and key price factors.</p>
              </section>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
