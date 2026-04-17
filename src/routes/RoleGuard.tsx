import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import type { UserRole } from '@/lib/types'

interface RoleGuardProps {
  allow: UserRole[]
  children: ReactNode
}

export default function RoleGuard({ allow, children }: RoleGuardProps) {
  const { session, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (authLoading || profileLoading) return <div className="p-6">Loading…</div>
  if (!session) return <Navigate to="/signin" replace />
  if (!profile) return <Navigate to="/select-role" replace />

  if (!allow.includes(profile.role)) {
    if (profile.role === 'applicant') return <Navigate to="/applicant/dashboard" replace />
    if (profile.role === 'recruiter') return <Navigate to="/company/dashboard" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
