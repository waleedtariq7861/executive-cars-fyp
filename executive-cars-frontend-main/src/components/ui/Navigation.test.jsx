import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Dropdown, DropdownItem, Pagination, Tabs } from './Navigation.jsx'

const renderMenu = () => render(
  <MemoryRouter>
    <p>Outside</p>
    <Dropdown label="More"><DropdownItem to="/saved-cars">Saved Cars</DropdownItem><button type="button">Sign out</button></Dropdown>
  </MemoryRouter>,
)
const menu = () => document.querySelector('details')

describe('Dropdown', () => {
  it('closes on Escape and returns focus to its toggle', () => {
    renderMenu()
    menu().open = true
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menu().open).toBe(false)
    expect(document.activeElement).toBe(menu().querySelector('summary'))
  })

  it('closes when the user presses outside it but not inside it', () => {
    renderMenu()
    menu().open = true
    fireEvent.pointerDown(screen.getByRole('link', { name: 'Saved Cars' }))
    expect(menu().open).toBe(true)
    fireEvent.pointerDown(screen.getByText('Outside'))
    expect(menu().open).toBe(false)
  })

  it('closes after choosing a link or a button in the panel', () => {
    renderMenu()
    menu().open = true
    fireEvent.click(screen.getByRole('link', { name: 'Saved Cars' }))
    expect(menu().open).toBe(false)
    menu().open = true
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(menu().open).toBe(false)
  })
})

describe('Tabs and Pagination', () => {
  it('only the selected tab is in the tab order', () => {
    render(<Tabs items={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} value="b" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('tabindex', '0')
  })

  it('gives each page button an accessible name and marks the current page', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Page 3' })).not.toHaveAttribute('aria-current')
  })
})
