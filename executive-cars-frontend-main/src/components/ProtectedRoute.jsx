import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'
import { hasActiveMembership } from '../utils/membership.js'

export default function ProtectedRoute({ role = 'user', capability, unauthenticatedMessage, children }) {
  const { user, initializing, logoutRedirect, clearLogoutRedirect } = useAuth()
  const location = useLocation()

  // A deliberate sign out lands on the page the user chose instead of the login form.
  // The choice is forgotten only once this guard has unmounted, i.e. the navigation really happened;
  // clearing it earlier would let the guard fall back to the login redirect while the move is pending.
  const redirectingAfterSignOut = useRef(false)
  redirectingAfterSignOut.current = !user && Boolean(logoutRedirect)
  useEffect(() => () => { if (redirectingAfterSignOut.current) clearLogoutRedirect?.() }, [clearLogoutRedirect])
  if (!user && logoutRedirect) return <Navigate to={logoutRedirect} replace />

  if (initializing) {
    return <div className="min-h-[50vh] flex items-center justify-center" role="status"><span className="text-sm font-semibold text-gray-500">Restoring your session...</span></div>
  }

  if (!user || user.role !== role) {
    const loginPath = role === 'admin' ? '/admin/login' : '/login'
    const from = `${location.pathname}${location.search}`
    const message = user
      ? (role === 'admin'
        ? 'This area is for administrators. Sign in with an administrator account to continue.'
        : 'This page is for customer accounts. Sign in with a customer account to continue.')
      : unauthenticatedMessage
    return <Navigate to={loginPath} state={{ from, message }} replace />
  }

  if (capability === 'auction' && !hasActiveMembership(user)) {
    return <Navigate to="/auction/payment" replace />
  }

  return children
}
