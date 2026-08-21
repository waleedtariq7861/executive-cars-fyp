import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './Feedback.jsx'

describe('EmptyState', () => {
  it('renders a useful title and description', () => {
    render(<EmptyState title="No cars found" description="Clear one or more filters and try again." />)
    expect(screen.getByRole('heading', { name: 'No cars found' })).toBeInTheDocument()
    expect(screen.getByText(/clear one or more filters/i)).toBeInTheDocument()
  })
})
