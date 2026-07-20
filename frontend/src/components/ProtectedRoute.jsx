import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { authenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-page" style={{ background: 'var(--color-bg)' }}>
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/app/ask" replace />
  }

  return children
}
