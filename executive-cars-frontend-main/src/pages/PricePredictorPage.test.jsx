import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import PricePredictorPage from './PricePredictorPage.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../components/Navbar.jsx', () => ({ default: () => <nav aria-label="Main navigation" /> }))
vi.mock('../components/Footer.jsx', () => ({ default: () => <footer /> }))

describe('PricePredictorPage', () => {
  const vehicleCatalog = { vehicles: [{ make: 'Suzuki', model: 'Cultus', years: [2021, 2022], variants: [
    { name: 'VXR', engineCapacity: 998, transmissions: ['Manual'], fuelTypes: ['Petrol'], bodyType: 'Hatchback', assemblyTypes: ['Local'] },
    { name: 'VXL', engineCapacity: 998, transmissions: ['Manual'], fuelTypes: ['Petrol'], bodyType: 'Hatchback', assemblyTypes: ['Local'] },
    { name: 'VXL AGS', engineCapacity: 998, transmissions: ['Auto'], fuelTypes: ['Petrol'], bodyType: 'Hatchback', assemblyTypes: ['Local'] },
  ] }, {
    make: 'Toyota', model: 'Corolla', years: [2014], variants: [
      { name: 'XLi 1.3 MT', engineCapacity: 1298, transmissions: ['Manual'], fuelTypes: ['Petrol'], bodyType: 'Sedan', assemblyTypes: ['Local'] },
    ],
  }, {
    make: 'Toyota', model: 'Corolla', years: [2020], variants: [
      { name: '1.6 Gasoline', engineCapacity: 1598, transmissions: ['Manual', 'Auto'], fuelTypes: ['Petrol'], bodyType: 'Sedan', assemblyTypes: ['Local'] },
    ],
  }, {
    make: 'Honda', model: 'Civic', years: [2020], variants: [
      { name: 'RS Turbo 1.5', engineCapacity: 1498, transmissions: ['Auto'], fuelTypes: ['Petrol'], bodyType: 'Sedan', assemblyTypes: ['Local'] },
    ],
  }, {
    make: 'Honda', model: 'City', years: [2018], variants: [
      { name: 'Aspire Prosmatec 1.5 i-VTEC', engineCapacity: 1497, transmissions: ['Auto'], fuelTypes: ['Petrol'], bodyType: 'Sedan', assemblyTypes: ['Local'] },
    ],
  }, {
    make: 'Suzuki', model: 'Alto', years: [2021], variants: [
      { name: 'VXR', engineCapacity: 658, transmissions: ['Manual'], fuelTypes: ['Petrol'], bodyType: 'Hatchback', assemblyTypes: ['Local'] },
    ],
  }] }
  const datasetOnly = [
    { make: 'Hyundai', model: 'Tucson', years: [2021], engines: [1999], transmissions: ['Auto'], fuels: ['Petrol'], bodyTypes: ['Suv'], assemblies: ['Imported'] },
    { make: 'Suzuki', model: 'Cultus', years: [2017], engines: [998], transmissions: ['Manual'], fuels: ['Petrol'], bodyTypes: ['Hatchback'], assemblies: ['Local'] },
    { make: 'Toyota', model: 'Corolla', years: [2020], engines: [1600], transmissions: ['Manual'], fuels: ['Petrol'], bodyTypes: ['Sedan'], assemblies: ['Imported'] },
  ]

  const optionsFor = params => {
    const make = params?.make
    const model = params?.model
    const year = Number(params?.year)
    const records = vehicleCatalog.vehicles.filter(item => item.make === make && item.model === model)
    const datasetRecord = datasetOnly.find(item => item.make === make && item.model === model) || null
    const record = records.find(item => item.years.includes(year))
    return {
      makes: [...new Set([...vehicleCatalog.vehicles.map(item => item.make), ...datasetOnly.map(item => item.make)])],
      models: !make ? [] : [...new Set([...vehicleCatalog.vehicles.filter(item => item.make === make).map(item => item.model), ...datasetOnly.filter(item => item.make === make).map(item => item.model)])],
      years: [...new Set([...records.flatMap(item => item.years), ...(datasetRecord?.years || [])])],
      variants: record?.variants || [],
      engines: datasetRecord?.engines || [], transmissions: datasetRecord?.transmissions || [], fuels: datasetRecord?.fuels || [], bodyTypes: datasetRecord?.bodyTypes || [], assemblies: datasetRecord?.assemblies || [],
      coverageLevel: record ? 'verified' : (datasetRecord ? 'dataset' : 'unsupported'),
      supported: Boolean(record || datasetRecord),
    }
  }
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url, config) => Promise.resolve({ data: url === '/vehicle-options' ? optionsFor(config?.params) : { available: false } }))
  })

  const selectCultus = async (variant = 'VXR') => {
    fireEvent.change(await screen.findByLabelText(/^Make/), { target: { value: 'Suzuki' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: 'Cultus' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2021' } })
    await waitFor(() => expect(screen.getByLabelText(/^Variant/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Variant/), { target: { value: variant } })
  }

  it('submits vehicle data and presents a customer-focused valuation', async () => {
    api.post.mockResolvedValue({ data: {
      predicted_price: 4500000,
      estimatedMarketPrice: 4500000,
      recommendedRange: { low: 4200000, high: 4800000 },
      confidence: .62,
      confidenceDetails: { level: 'medium', explanation: 'Based on comparable coverage.' },
      comparableVehicleCount: 8,
      marketDemand: 'moderate listing activity',
      mainPricingFactors: ['Vehicle age: 0 years'],
      datasetReferenceYear: 2022,
      modelVersion: 'trained-test-model', isFallback: false,
    } })
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    await selectCultus()
    fireEvent.click(screen.getByRole('button', { name: /generate valuation/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/predict-price',
      expect.objectContaining({ make: 'Suzuki', model: 'Cultus', year: 2021, variant: 'VXR', engineCapacity: 998, transmission: 'Manual', fuelType: 'Petrol', bodyType: 'Hatchback', assemblyType: 'Local' }),
      expect.objectContaining({ timeout: 12000 }),
    ))
    expect(await screen.findByText('Expected Market Range')).toBeInTheDocument()
    expect(screen.getByText('PKR 42.0 Lacs – PKR 48.0 Lacs')).toBeInTheDocument()
    expect(screen.getByText('Estimated midpoint')).toBeInTheDocument()
    expect(screen.getByText('PKR 4,500,000')).toBeInTheDocument()
    expect(screen.getByText(/Model reference year: 2022/)).toBeInTheDocument()
    expect(screen.getByText('Age at dataset year (2022): 0 years')).toBeInTheDocument()
    expect(screen.queryByText('Comparable fallback')).not.toBeInTheDocument()
    expect(screen.queryByText(/cleaned records/i)).not.toBeInTheDocument()
  })

  it('ignores a late options response for an earlier vehicle selection', async () => {
    let resolveInitialOptions
    api.get.mockImplementation((url, config) => {
      if (url !== '/vehicle-options') return Promise.resolve({ data: { available: true, inputCatalog: { makes: [{ make: 'Toyota' }] } } })
      if (!config?.params?.make) return new Promise(resolve => { resolveInitialOptions = resolve })
      return Promise.resolve({ data: optionsFor(config.params) })
    })
    api.post.mockResolvedValue({ data: { estimatedPrice: 6092000, recommendedRange: { low: 5600000, high: 6600000 } } })
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)

    await waitFor(() => expect(screen.getByLabelText(/^Make/)).toHaveValue(''))
    await waitFor(() => expect(screen.getByRole('option', { name: 'Toyota' })).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText(/^Make/), { target: { value: 'Toyota' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: 'Corolla' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2020' } })
    const variant = await screen.findByLabelText(/^Variant\s*\*$/)
    fireEvent.change(variant, { target: { value: '1.6 Gasoline' } })

    await act(async () => { resolveInitialOptions({ data: optionsFor({}) }) })
    expect(screen.getByLabelText(/^Variant\s*\*$/)).toHaveValue('1.6 Gasoline')
    expect(screen.getByLabelText(/^Engine/)).toHaveValue('1598')
    expect(screen.getByLabelText(/^Assembly/)).toHaveValue('Local')
    fireEvent.click(screen.getByRole('button', { name: /generate valuation/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/predict-price',
      expect.objectContaining({ make: 'Toyota', model: 'Corolla', year: 2020, variant: '1.6 Gasoline', engineCapacity: 1598, transmission: 'Manual', fuelType: 'Petrol', bodyType: 'Sedan', assemblyType: 'Local' }),
      expect.anything(),
    ))
  })

  it('does not apply dataset-only specifications over a verified Corolla variant', async () => {
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    fireEvent.change(await screen.findByLabelText(/^Make/), { target: { value: 'Toyota' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: 'Corolla' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2020' } })
    const verifiedVariant = await screen.findByLabelText(/^Variant\s*\*$/)
    expect(screen.getByLabelText(/^Assembly/)).toHaveValue('')
    fireEvent.change(verifiedVariant, { target: { value: '1.6 Gasoline' } })
    expect(screen.getByLabelText(/^Engine/)).toHaveValue('1598')
    expect(screen.getByLabelText(/^Assembly/)).toHaveValue('Local')
  })

  it('cascades verified selections, refreshes specifications, and renders backend validation errors', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Please correct the vehicle configuration.', errors: { engineCapacity: 'Verified Suzuki Cultus VXR uses 998 cc.', transmission: 'Transmission is not valid for this verified configuration.' } } } })
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    expect(screen.getByLabelText(/^Model\s*\*$/)).toBeDisabled()
    await selectCultus('VXL AGS')
    expect(screen.getByLabelText(/^Engine/)).toHaveValue('998')
    expect(screen.getByLabelText(/^Transmission/)).toHaveValue('Auto')
    expect(screen.getByLabelText(/^Fuel type/)).toHaveValue('Petrol')
    expect(screen.getByLabelText(/^Body type/)).toHaveValue('Hatchback')
    fireEvent.click(screen.getByRole('button', { name: /generate valuation/i }))
    expect(await screen.findByText('Please correct the vehicle configuration.')).toBeInTheDocument()
    expect(screen.getByText('Verified Suzuki Cultus VXR uses 998 cc.')).toBeInTheDocument()
    expect(screen.getByText('Transmission is not valid for this verified configuration.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Transmission/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears dependent vehicle data when identity selections change', async () => {
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    await selectCultus('VXL AGS')
    expect(screen.getByLabelText(/^Engine/)).toHaveValue('998')

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2022' } })
    })
    expect(screen.getByLabelText(/^Variant/)).toHaveValue('')
    expect(screen.getByLabelText(/^Engine/)).toHaveValue('')
    expect(screen.getByLabelText(/^Transmission/)).toHaveValue('')

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^Make/), { target: { value: '' } })
    })
    expect(screen.getByLabelText(/^Model\s*\*$/)).toHaveValue('')
    expect(screen.getByLabelText(/^Model year/)).toHaveValue('')
    expect(screen.getByLabelText(/^Variant/)).toHaveValue('')
    expect(screen.getByLabelText(/^Fuel type/)).toHaveValue('')
    expect(screen.getByLabelText(/^Body type/)).toHaveValue('')
    expect(screen.getByLabelText(/^Assembly/)).toHaveValue('')
  })

  it('marks a verified variant as required and blocks submission until it is selected', async () => {
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    fireEvent.change(await screen.findByLabelText(/^Make/), { target: { value: 'Suzuki' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: 'Cultus' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2021' } })

    const verifiedVariant = await screen.findByLabelText(/^Variant\s*\*$/)
    expect(verifiedVariant).toBeRequired()
    fireEvent.click(screen.getByRole('button', { name: /generate valuation/i }))

    expect(await screen.findByText('Select a verified variant for this model year.')).toBeInTheDocument()
    expect(verifiedVariant).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(verifiedVariant).toHaveFocus())
    expect(verifiedVariant).toHaveAttribute('aria-describedby', 'predict-variant-error')
    expect(verifiedVariant).toHaveAttribute('aria-errormessage', 'predict-variant-error')
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([
    ['Toyota', 'Corolla', '2014', 'XLi 1.3 MT', '1298'],
    ['Honda', 'Civic', '2020', 'RS Turbo 1.5', '1498'],
    ['Honda', 'City', '2018', 'Aspire Prosmatec 1.5 i-VTEC', '1497'],
    ['Suzuki', 'Alto', '2021', 'VXR', '658'],
  ])('offers dependent options and derives specifications for %s %s', async (make, model, year, variant, engine) => {
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    fireEvent.change(await screen.findByLabelText(/^Make/), { target: { value: make } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: model } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: year } })
    await waitFor(() => expect(screen.getByLabelText(/^Variant/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Variant/), { target: { value: variant } })
    await waitFor(() => expect(screen.getByLabelText(/^Engine/)).toHaveValue(engine))
    expect(screen.getByLabelText(/^Fuel type/)).toHaveValue('Petrol')
  })

  it('keeps a dataset-only Hyundai vehicle usable with an optional manual variant', async () => {
    api.post.mockResolvedValue({ data: { estimatedPrice: 8079000, lowerRange: 7600000, upperRange: 8558000, method: 'trained_ml' } })
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    fireEvent.change(await screen.findByLabelText(/^Make/), { target: { value: 'Hyundai' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: 'Tucson' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2021' } })
    await waitFor(() => expect(screen.getByLabelText(/^Engine/)).toHaveValue('1999'))
    expect(screen.getByLabelText(/^Variant/)).toHaveValue('')
    expect(screen.getByLabelText(/^Variant/)).not.toBeDisabled()
    fireEvent.change(screen.getByLabelText(/^Variant/), { target: { value: 'GL' } })
    expect(screen.getByLabelText(/^Transmission/)).toHaveValue('Auto')
    fireEvent.click(screen.getByRole('button', { name: /generate valuation/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/predict-price', expect.objectContaining({ make: 'Hyundai', model: 'Tucson', variant: 'GL', engineCapacity: 1999 }), expect.anything()))
  })

  it('uses an optional manual variant for a dataset-supported historical Cultus year', async () => {
    render(<MemoryRouter><PricePredictorPage /></MemoryRouter>)
    fireEvent.change(await screen.findByLabelText(/^Make/), { target: { value: 'Suzuki' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model\s*\*$/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model\s*\*$/), { target: { value: 'Cultus' } })
    await waitFor(() => expect(screen.getByLabelText(/^Model year/)).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText(/^Model year/), { target: { value: '2017' } })
    const manualVariant = await screen.findByLabelText(/^Variant \(optional\)/)
    expect(manualVariant).not.toBeDisabled()
    fireEvent.change(manualVariant, { target: { value: 'VXL' } })
    expect(manualVariant).toHaveValue('VXL')
  })
})
