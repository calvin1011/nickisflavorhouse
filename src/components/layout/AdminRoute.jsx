import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AdminRoute({ children }) {
  const { isAuthenticated, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <p className="text-brand-foreground/70">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
