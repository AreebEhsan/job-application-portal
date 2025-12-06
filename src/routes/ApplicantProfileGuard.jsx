import { Navigate, useLocation } from 'react-router-dom'
import { useProfile } from '@/context/ProfileContext'

export default function ApplicantProfileGuard({ children }) {
  const { profile, loading } = useProfile()
  const location = useLocation()

  if (loading) return <div className="p-6">Loading profile…</div>

  // Only care about applicants
  if (!profile || profile.role !== 'applicant') return children

  const needsSetup = !profile.full_name

  // Avoid redirect loop: if already on setup page, allow
  const onSetupPage = location.pathname.startsWith('/applicant/profile-setup')

  if (needsSetup && !onSetupPage) {
    return <Navigate to="/applicant/profile-setup" replace />
  }

  return children
}