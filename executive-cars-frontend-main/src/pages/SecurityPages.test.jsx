import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import SecurityPage from './SecurityPage.jsx'
import AdminSecurityPage from './admin/AdminSecurityPage.jsx'
import { ADMIN_FILTERS, eventLabel } from '../utils/authEvents.js'

vi.mock('../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('../components/Navbar.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))
vi.mock('../context/authContext.js', () => ({ useAuth: () => ({ user: { id: 'u1', role: 'user', name: 'Customer', emailVerified: true }, logout: vi.fn() }) }))

const events = [
  { id: 'e1', type: 'mail_failed', at: '2026-11-10T09:00:00Z', device: 'Unknown device', detail: 'password reset code', accountModel: 'member', email: 'c***@example.com', account: { name: 'Some Customer', email: 'customer@example.com' } },
  { id: 'e2', type: 'login_failure', at: '2026-11-10T08:00:00Z', device: 'Chrome on Windows', ip: '203.0.113.5', accountModel: 'admin', email: 'a***@example.com', account: null },
]

beforeEach(() => {
  vi.resetAllMocks()
  api.get.mockImplementation(async url => {
    if (url === '/auth/sessions') return { data: { sessions: [{ id: 's1', current: true, device: 'Chrome on Windows', signedInAt: '2026-11-10T08:00:00Z', lastSeenAt: '2026-11-10T09:00:00Z' }] } }
    if (url === '/auth/activity') return { data: { events: [{ id: 'a1', type: 'password_changed', at: '2026-11-10T07:00:00Z', device: 'Chrome on Windows' }] } }
    if (url === '/admin/auth-events') return { data: { summary: { loginFailures24h: 3, mailFailures24h: 2, resetRequests24h: 1 }, events } }
    throw new Error(`unexpected request ${url}`)
  })
})

describe('SecurityPage', () => {
  it('brings the password form, the signed-in devices and the recent activity together', async () => {
    render(<MemoryRouter><SecurityPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /My account/ })).toHaveAttribute('href', '/account')
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current password', { exact: true })).toBeInTheDocument()
    expect(await screen.findByText('This device')).toBeInTheDocument()
    expect(await screen.findByText('Password changed')).toBeInTheDocument()
  })
})

describe('AdminSecurityPage', () => {
  const renderPage = () => render(<MemoryRouter><AdminSecurityPage /></MemoryRouter>)

  it('shows the 24-hour counts, warns about undelivered email, and lists events with the account behind them', async () => {
    renderPage()
    expect(await screen.findByText('Some Customer')).toBeInTheDocument()
    expect(screen.getByText('Failed sign-ins (24 h)').nextSibling).toHaveTextContent('3')
    expect(screen.getByText('Emails not delivered (24 h)').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Password reset requests (24 h)').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Some security emails did not reach customers')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Account activity' })
    expect(within(table).getByText('Email could not be delivered')).toBeInTheDocument()
    expect(within(table).getByText('password reset code')).toBeInTheDocument()
    expect(within(table).getByText('customer@example.com')).toBeInTheDocument()
    expect(within(table).getByText('Customer')).toBeInTheDocument()
    expect(within(table).getByText('a***@example.com')).toBeInTheDocument()
    expect(within(table).getByText('Chrome on Windows · 203.0.113.5')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/admin/auth-events', { params: {} })
  })

  it('asks the server for only the chosen kind of event', async () => {
    renderPage()
    await screen.findByText('Some Customer')
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'mail_failed' } })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/admin/auth-events', { params: { type: 'mail_failed' } }))
  })

  it('does not warn when no mail failed, and has an empty state', async () => {
    api.get.mockImplementation(async url => (url === '/admin/auth-events'
      ? { data: { summary: { loginFailures24h: 0, mailFailures24h: 0, resetRequests24h: 0 }, events: [] } }
      : { data: { sessions: [], events: [] } }))
    renderPage()
    expect(await screen.findByText('No events found')).toBeInTheDocument()
    expect(screen.queryByText('Some security emails did not reach customers')).not.toBeInTheDocument()
  })

  it('reports a failed load and retries it', async () => {
    let calls = 0
    api.get.mockImplementation(async url => {
      if (url !== '/admin/auth-events') return { data: { sessions: [], events: [] } }
      calls += 1
      if (calls === 1) throw { response: { status: 500, data: { message: 'Could not load the security events' } } }
      return { data: { summary: { loginFailures24h: 0, mailFailures24h: 0, resetRequests24h: 0 }, events: [] } }
    })
    renderPage()
    expect(await screen.findByText(/Could not load the security events/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No events found')).toBeInTheDocument()
  })

  it('also hosts the administrator\'s own password form, sessions and activity', async () => {
    renderPage()
    await screen.findByText('Some Customer')
    expect(screen.getByRole('heading', { name: 'Change your password' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current password', { exact: true })).toBeInTheDocument()
    expect(await screen.findByText('This device')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your recent activity' })).toBeInTheDocument()
  })
})

describe('event labels', () => {
  it('has a plain-language name for every event type and keeps unknown ones readable', () => {
    for (const type of ['registered', 'login_success', 'login_failure', 'logout', 'password_changed', 'reset_requested', 'reset_completed', 'email_verified', 'session_revoked', 'mail_failed']) {
      expect(eventLabel(type)).not.toBe(type)
    }
    expect(eventLabel('something_new')).toBe('something_new')
    expect(ADMIN_FILTERS[0]).toEqual(['', 'All events'])
  })
})
