import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'

export default function ApplicantProfileGuard({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile()
  const location = useLocation()

  if (loading) return <div className="p-6">Loading profile…</div>
  if (!profile || profile.role !== 'applicant') return <>{children}</>

  const needsSetup = !profile.full_name
  const onSetupPage = location.pathname.startsWith('/applicant/profile-setup')

  if (needsSetup && !onSetupPage) {
    return <Navigate to="/applicant/profile-setup" replace />
  }

  return <>{children}</>
}
