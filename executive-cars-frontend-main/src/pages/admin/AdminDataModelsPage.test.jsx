import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import AdminDataModelsPage from './AdminDataModelsPage.jsx'

vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../components/AdminLayout.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../../context/toastContext.js', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

describe('AdminDataModelsPage provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation(url => {
      if (url.endsWith('dataset-summary')) return Promise.resolve({ data: { rowCount: 0, sources: [] } })
      if (url.endsWith('dataset-imports')) return Promise.resolve({ data: [] })
      if (url.endsWith('model-health')) return Promise.resolve({ data: { reachable: true, modelLoaded: true } })
      return Promise.resolve({ data: {
        activeVersion: 'ec-20260820-100203-13d9e2ba',
        previousVersion: null,
        versions: [{
          version: 'ec-20260820-100203-13d9e2ba', modelName: 'extra_trees', datasetSize: 72179, trainedRows: 57743,
          trainingDate: '2026-08-20T10:02:03Z', metrics: { mae: 328377, r2: 0.9548 },
          provenance: { datasetName: 'pakwheels_used_car_data_v02.csv', sourceCategory: 'Legacy metadata unavailable', datasetFingerprint: '13d9e2baaf4e4723', datasetRows: 72179, trainedRows: 57743 },
        }],
      } })
    })
  })

  it('separates rows available for the next run from active-model provenance', async () => {
    render(<AdminDataModelsPage />)
    expect(await screen.findByText('Admin-imported training rows')).toBeInTheDocument()
    expect(screen.getByText('Active model provenance')).toBeInTheDocument()
    expect(screen.getByText('pakwheels_used_car_data_v02.csv')).toBeInTheDocument()
    expect(screen.getByText('13d9e2baaf4e4723')).toBeInTheDocument()
    expect(screen.getByText(/Training needs at least 30 imported rows; 0 are currently available/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Train model' })).toBeDisabled()
  })
})
