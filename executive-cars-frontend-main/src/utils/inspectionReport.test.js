import { describe, expect, it } from 'vitest'
import { hasInspectionReport } from './inspectionReport.js'

describe('hasInspectionReport', () => {
  it('requires an authorized report endpoint instead of status text or a legacy URL', () => {
    expect(hasInspectionReport({ inspectionStatus: 'report_available', hasInspectionReport: false })).toBe(false)
    expect(hasInspectionReport({ inspectionStatus: 'report_available', pdfUrl: 'https://legacy.example/report.pdf' })).toBe(false)
    expect(hasInspectionReport({ hasInspectionReport: true, inspectionReportAccessPath: '/documents/products/1/report' })).toBe(true)
  })
})
