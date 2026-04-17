import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getApplicantSkills, getJobsWithSkills, getMyApplications } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'
import JobCard from '@/components/JobCard'
import Pagination from '@/components/ui/Pagination'
import { rankJobs } from '@/utils/recommend'

const PAGE_SIZE = 9

export default function ApplicantDashboard() {
  const { profile } = useProfile()
  const applicantId = profile?.applicant_id ?? ''
  const [page, setPage] = useState(1)

  const appsQuery = useQuery({
    queryKey: ['applications', applicantId, page],
    queryFn: () => getMyApplications(applicantId, page, PAGE_SIZE),
    enabled: !!applicantId,
  })

  const skillsQuery = useQuery({
    queryKey: ['applicant-skills', applicantId],
    queryFn: () => getApplicantSkills(applicantId),
    enabled: !!applicantId,
  })

  const jobsQuery = useQuery({
    queryKey: ['jobs-with-skills'],
    queryFn: getJobsWithSkills,
    enabled: !!applicantId,
    staleTime: 1000 * 60 * 5,
  })

  const apps = appsQuery.data?.data ?? []
  const totalApps = appsQuery.data?.count ?? 0

  const recommended = (() => {
    if (!skillsQuery.data || !jobsQuery.data || !appsQuery.data) return []
    const appliedIds = new Set(appsQuery.data.data.map(a => a.job_id))
    return rankJobs(skillsQuery.data, jobsQuery.data)
      .filter(j => !appliedIds.has(j.job_id))
      .slice(0, 6)
  })()

  const STATUS_LABEL: Record<string, string> = {
    submitted: 'Submitted',
    in_review: 'In Review',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-8 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-4xl font-bold mb-4">My Applications</h1>
        <p className="text-white/90">Review your application statuses and track progress.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Applications</h2>
        {appsQuery.isLoading ? (
          <p className="text-white/70 text-sm">Loading applications…</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {apps.map(app => (
                <div
                  key={app.application_id}
                  className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300"
                >
                  <div className="text-lg font-semibold">{app.job?.title}</div>
                  <div className="text-sm text-white/80">
                    {app.job?.company?.name}
                  </div>
                  <div className="text-sm mt-1 text-white/70">
                    Status:{' '}
                    <span className="font-medium text-white">
                      {STATUS_LABEL[app.status] ?? app.status}
                    </span>
                  </div>
                </div>
              ))}
              {apps.length === 0 && (
                <div className="glass p-4">
                  <div className="text-sm text-white/80">No applications yet.</div>
                </div>
              )}
            </div>

            <Pagination
              page={page}
              totalCount={totalApps}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      {recommended.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Recommended Jobs</h2>
          <p className="text-sm text-white/80">Based on your saved skills profile.</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommended.map(job => (
              <div key={job.job_id} className="relative">
                <JobCard job={job} />
                <div className="absolute top-3 right-3 text-xs bg-white/10 border border-white/20 rounded-full px-2 py-0.5">
                  Match: {((job.score ?? 0) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
