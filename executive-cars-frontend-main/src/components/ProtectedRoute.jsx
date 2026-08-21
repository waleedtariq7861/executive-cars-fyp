import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'
import { hasActiveMembership } from '../utils/membership.js'

export default function ProtectedRoute({ role = 'user', capability, unauthenticatedMessage, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user || user.role !== role) {
    const loginPath = role === 'admin' ? '/admin/login' : '/login'
    const from = `${location.pathname}${location.search}`
    return <Navigate to={loginPath} state={{ from, message: unauthenticatedMessage }} replace />
  }

  if (capability === 'auction' && !hasActiveMembership(user)) {
    return <Navigate to="/auction/payment" replace />
  }

  return children
}
