import { useEffect, useState } from 'react'
import { getMyApplications, getOrCreateApplicant } from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'

export default function ApplicantDashboard() {
  const { session } = useAuth()
  const [apps, setApps] = useState([])

  useEffect(() => { (async () => {
    if (!session) return
    const me = await getOrCreateApplicant(session.user.id, session.user.email || undefined)
    const a = await getMyApplications(me.applicant_id)
    setApps(a)
  })() }, [session])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Applications</h1>
      <div className="space-y-2">
        {apps.map(app => (
          <div key={app.application_id} className="border rounded p-3">
            <div className="font-medium">{app.job?.title}</div>
            <div className="text-sm text-gray-600">Status: {app.status}</div>
            <div className="text-sm">Company: {app.job?.company?.name}</div>
          </div>
        ))}
        {!apps.length && <div className="text-sm text-gray-600">No applications yet.</div>}
      </div>
    </div>
  )
}
