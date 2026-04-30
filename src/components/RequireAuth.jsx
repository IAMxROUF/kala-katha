import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children, role }) {
  const { user, isAuthed } = useAuth()
  const location = useLocation()

  if (!isAuthed) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }
  if (role && user?.role !== role) {
    // Soft redirect: explorers landing on artisan-only routes go home, with no error.
    return <Navigate to="/dashboard" replace />
  }
  return children
}
