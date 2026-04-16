import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

export default function RoleGuard({ allow, children }) {
  const { session, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return <div className="p-6">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/signin" replace />
  }

  // Logged-in but no profile yet: force them to select/repair role
  if (!profile) {
    return <Navigate to="/select-role" replace />
  }

  if (!allow.includes(profile.role)) {
    if (profile?.role === 'applicant') {
      return <Navigate to="/applicant" replace />
    }
    if (profile?.role === 'recruiter') {
      return <Navigate to="/company" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
