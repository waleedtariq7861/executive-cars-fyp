import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VehicleImage from './VehicleImage.jsx'

describe('VehicleImage', () => {
  it('renders the shared fallback when a source is missing', () => {
    render(<VehicleImage alt="Toyota Corolla" />)
    expect(screen.getByRole('img', { name: 'Toyota Corolla image unavailable' })).toBeInTheDocument()
  })

  it('switches to the shared fallback when the image fails', () => {
    render(<VehicleImage src="https://example.test/missing.jpg" alt="Honda Civic" />)
    fireEvent.error(screen.getByRole('img', { name: 'Honda Civic' }))
    expect(screen.getByRole('img', { name: 'Honda Civic image unavailable' })).toBeInTheDocument()
  })
})
