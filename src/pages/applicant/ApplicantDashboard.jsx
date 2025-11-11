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
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-4xl font-bold mb-4">My Applications</h1>
        <p className="text-white/90 mb-2">Review your application statuses and track progress.</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.application_id} className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300">
            <div className="text-lg font-semibold">{app.job?.title}</div>
            <div className="text-sm text-white/80">Company: {app.job?.company?.name}</div>
            <div className="text-sm mt-1">Status: {app.status}</div>
          </div>
        ))}
        {!apps.length && (
          <div className="glass p-4">
            <div className="text-sm text-white/80">No applications yet.</div>
          </div>
        )}
      </div>
    </div>
  )
}
