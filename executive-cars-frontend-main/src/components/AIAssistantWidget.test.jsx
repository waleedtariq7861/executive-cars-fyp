import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import AIAssistantWidget from './AIAssistantWidget.jsx'

vi.mock('../api/api.js', () => ({ default: { post: vi.fn() } }))

describe('AIAssistantWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
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
})
