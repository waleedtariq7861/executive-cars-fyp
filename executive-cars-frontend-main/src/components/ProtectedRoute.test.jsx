import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from './ProtectedRoute.jsx'
import { AuthContext } from '../context/authContext.js'

function renderRoute(user) {
  return render(<AuthContext.Provider value={{ user }}><MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<p>Login screen</p>} /><Route path="/private" element={<ProtectedRoute role="user"><p>Private account</p></ProtectedRoute>} /></Routes></MemoryRouter></AuthContext.Provider>)
}

function LoginState() {
  const location = useLocation()
  return <p>Redirect: {location.state?.from} — {location.state?.message}</p>
}

describe('ProtectedRoute', () => {
  it('redirects a signed-out visitor', () => {
    renderRoute(null)
    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })

  it('renders for a matching account role', () => {
    renderRoute({ role: 'user' })
    expect(screen.getByText('Private account')).toBeInTheDocument()
  })

  it('preserves the complete inspection destination and sign-in message', () => {
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter initialEntries={['/seller/book-inspection?source=sell-page']}>
          <Routes>
            <Route path="/login" element={<LoginState />} />
            <Route
              path="/seller/book-inspection"
              element={
                <ProtectedRoute role="user" unauthenticatedMessage="Please sign in to book a vehicle inspection.">
                  <p>Inspection form</p>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )
    expect(screen.getByText(/Redirect: \/seller\/book-inspection\?source=sell-page/)).toHaveTextContent(
      'Please sign in to book a vehicle inspection.'
    )
  })
})
