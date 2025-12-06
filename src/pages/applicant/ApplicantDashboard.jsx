import { useEffect, useState } from 'react'
import {
  getApplicantSkills,
  getJobsWithSkills,
  getMyApplications,
  getOrCreateApplicant,
  updateApplicant,
} from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import JobCard from '@/components/JobCard'
import { rankJobs } from '@/utils/recommend'

export default function ApplicantDashboard() {
  const { session } = useAuth()
  const { profile } = useProfile()

  const [apps, setApps] = useState([])
  const [recommended, setRecommended] = useState([])

  useEffect(() => {
    ;(async () => {
      if (!session) return

      // Ensure we have an applicant row for this user
      let me = await getOrCreateApplicant(session.user.id, session.user.email || undefined)

      // Self-heal: if applicant.name/email are missing but we have profile/email, sync them.
      try {
        const patch = {}

        if (!me.name && profile?.full_name) {
          patch.name = profile.full_name
        }

        if (
          session.user.email &&
          (!me.email || me.email !== session.user.email)
        ) {
          patch.email = session.user.email
        }

        if (Object.keys(patch).length > 0) {
          me = await updateApplicant(me.applicant_id, patch)
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('ApplicantDashboard: failed to sync applicant name/email', e)
      }

      // Load this applicant's applications
      const a = await getMyApplications(me.applicant_id)
      setApps(a)

      // Load skills + recommended jobs
      const skills = await getApplicantSkills(me.applicant_id)
      const jobs = await getJobsWithSkills()
      const ranked = rankJobs(skills, jobs)
      const appliedJobIds = new Set(a.map((app) => app.job_id))
      const top = ranked.filter((j) => !appliedJobIds.has(j.job_id)).slice(0, 6)
      setRecommended(top)
    })()
  }, [session, profile])

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-8 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-4xl font-bold mb-4">My Applications</h1>
        <p className="text-white/90 mb-2">
          Review your application statuses and track progress.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Applications</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div
              key={app.application_id}
              className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300"
            >
              <div className="text-lg font-semibold">{app.job?.title}</div>
              <div className="text-sm text-white/80">
                Company: {app.job?.company?.name}
              </div>
              <div className="text-sm mt-1">Status: {app.status}</div>
            </div>
          ))}
          {!apps.length && (
            <div className="glass p-4">
              <div className="text-sm text-white/80">No applications yet.</div>
            </div>
          )}
        </div>
      </section>

      {!!recommended.length && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Recommended Jobs</h2>
          <p className="text-sm text-white/80">
            Based on your saved skills profile.
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommended.map((job) => (
              <div key={job.job_id} className="relative">
                <JobCard job={job} />
                <div className="absolute top-3 right-3 text-xs bg-white/10 border border-white/20 rounded-full px-2 py-0.5">
                  Match: {(job.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}