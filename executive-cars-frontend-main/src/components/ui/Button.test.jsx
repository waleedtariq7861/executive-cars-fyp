import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MemoryRouter, Link } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Search } from 'lucide-react'
import Button from './Button.jsx'

describe('Button', () => {
  it('lays an icon and its label out on one line', () => {
    render(<Button><Search data-testid="icon" />Find cars</Button>)
    const label = screen.getByText('Find cars')
    expect(label.tagName).toBe('SPAN')
    expect(label).toHaveClass('inline-flex', 'items-center')
    expect(label).toContainElement(screen.getByTestId('icon'))
  })

  it('does not call onClick while loading or disabled', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button loading onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button'))
    rerender(<Button disabled onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('blocks and de-focuses a disabled link rendered through `as`', () => {
    const onClick = vi.fn()
    render(<MemoryRouter><Button as={Link} to="/somewhere" disabled onClick={onClick}>Go</Button></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).toHaveAttribute('tabindex', '-1')
    const notPrevented = fireEvent.click(link)
    expect(notPrevented).toBe(false)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps an enabled link clickable', () => {
    const onClick = vi.fn()
    render(<MemoryRouter><Button as={Link} to="/somewhere" onClick={onClick}>Go</Button></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).not.toHaveAttribute('aria-disabled')
    fireEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('shared button styles', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
  const rule = name => css.match(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`))?.[1] || ''

  // Without a display value these render as inline boxes when used on <a>, which
  // drops the icon above the label and ignores w-full / vertical padding.
  it.each(['btn-primary', 'btn-brand', 'btn-search', 'btn-ghost', 'btn-white'])('%s is an inline-flex container', name => {
    expect(rule(name)).toMatch(/display:\s*inline-flex/)
    expect(rule(name)).toMatch(/align-items:\s*center/)
  })

  it('draws a fully opaque focus outline', () => {
    const outline = css.match(/:focus-visible\s*\{\s*outline:\s*([^;]+);/)?.[1] || ''
    expect(outline).toMatch(/#[0-9a-f]{6}\b/i)
    expect(outline).not.toMatch(/rgba/)
  })
})
