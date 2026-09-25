import React, { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Drawer, Modal } from './Overlays.jsx'

function ModalHarness() {
  const [open, setOpen] = useState(false)
  return <>
    <button type="button" onClick={() => setOpen(true)}>Open editor</button>
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Edit listing"
      description="Honda Civic"
      footer={<button type="button">Save changes</button>}
    >
      <label htmlFor="listing-name">Listing name</label>
      <input id="listing-name" />
    </Modal>
  </>
}

describe('accessible overlays', () => {
  it('exposes modal semantics, traps focus, inerts the background, closes on Escape, and restores focus', async () => {
    render(<ModalHarness />)
    const opener = screen.getByRole('button', { name: 'Open editor' })
    opener.focus()
    fireEvent.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Edit listing' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(opener.parentElement).toHaveAttribute('aria-hidden', 'true')
    const close = screen.getByRole('button', { name: 'Close' })
    await waitFor(() => expect(close).toHaveFocus())

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
    expect(opener.parentElement).not.toHaveAttribute('aria-hidden')
  })

  it('gives drawers dialog semantics and an accessible close control', async () => {
    const onClose = vi.fn()
    render(<Drawer open onClose={onClose} title="Edit used car"><button type="button">Save</button></Drawer>)
    expect(screen.getByRole('dialog', { name: 'Edit used car' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
