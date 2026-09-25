import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import AIAssistantWidget from './AIAssistantWidget.jsx'
import Navbar from './Navbar.jsx'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../context/authContext.js', () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }))

function MobileAssistantHarness() {
  const location = useLocation()
  return <><Navbar /><AIAssistantWidget /><output aria-label="Current route">{location.pathname}{location.search}</output></>
}

describe('AIAssistantWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: { status: 'available', modelUsable: true } })
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('shows actual capability state and prevents requests while unavailable', async () => {
    api.get.mockRejectedValue(new Error('health unavailable'))
    render(<MemoryRouter><AIAssistantWidget /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /open ai assistant/i }))

    expect(await screen.findByText('Temporarily unavailable')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ask me anything/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /send assistant message/i })).toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('does not submit empty assistant messages and shows a graceful API error', async () => {
    api.post.mockRejectedValue(new Error('network unavailable'))
    render(<MemoryRouter><AIAssistantWidget /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /open ai assistant/i }))
    const send = screen.getByRole('button', { name: /send assistant message/i })
    expect(send).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/ask me anything/i), { target: { value: 'How do auctions work?' } })
    fireEvent.click(send)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/chat', {
      messages: [{ role: 'user', content: 'How do auctions work?' }],
    }))
    expect(await screen.findByText(/having trouble right now/i)).toBeInTheDocument()
  })

  it('behaves as an accessible dialog and restores focus when Escape closes it', async () => {
    render(<MemoryRouter><AIAssistantWidget /></MemoryRouter>)

    const trigger = screen.getByRole('button', { name: /open ai assistant/i })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: /executive cars ai/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByPlaceholderText(/ask me anything/i)).toHaveFocus())
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: /open ai assistant/i })).toHaveFocus())
    expect(document.body.style.overflow).toBe('')
  })

  it.each(['Escape', 'close button'])('restores the mobile navigation trigger after %s without losing the current route', async closeMethod => {
    vi.stubGlobal('innerWidth', 390)
    render(<MemoryRouter initialEntries={['/used-cars?make=Toyota']}><MobileAssistantHarness /></MemoryRouter>)
    const trigger = screen.getByRole('link', { name: 'Open AI Assistant' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(await screen.findByRole('dialog', { name: 'Executive Cars AI' })).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByPlaceholderText(/ask me anything/i)).toHaveFocus())

    if (closeMethod === 'Escape') fireEvent.keyDown(document, { key: 'Escape' })
    else fireEvent.click(screen.getByRole('button', { name: 'Close AI Assistant' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/used-cars?make=Toyota')
    expect(trigger).toHaveAttribute('href', '/used-cars?make=Toyota&assistant=open')
    expect(document.body.style.overflow).toBe('')
  })
})
