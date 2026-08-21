import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLoginPage from './AdminLoginPage.jsx'

const { loginAdmin } = vi.hoisted(() => ({ loginAdmin: vi.fn() }))

vi.mock('../../context/authContext.js', () => ({
  useAuth: () => ({ loginAdmin }),
}))

describe('AdminLoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits admin credentials and redirects to the protected dashboard path', async () => {
    loginAdmin.mockResolvedValue({ success: true, role: 'admin' })
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<div>Admin dashboard opened</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'admin@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'demo-password-not-a-real-secret' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }))

    await waitFor(() => expect(loginAdmin).toHaveBeenCalledWith('admin@test.com', 'demo-password-not-a-real-secret'))
    expect(await screen.findByText('Admin dashboard opened')).toBeInTheDocument()
  })

  it('shows the backend login error', async () => {
    loginAdmin.mockResolvedValue({ success: false, message: 'Invalid credentials' })
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'admin@test.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }))
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})
