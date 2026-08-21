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
})
