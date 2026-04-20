import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getApplicantSkills, getJobsWithSkills, getMyApplications } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'
import { Link } from 'react-router-dom'
import JobCard from '@/components/JobCard'
import Pagination from '@/components/ui/Pagination'
import { rankJobs } from '@/utils/recommend'

const PAGE_SIZE = 9

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  submitted: { label: 'Submitted',  variant: 'bg-blue-500/15 border-blue-400/35 text-blue-300' },
  in_review: { label: 'In Review',  variant: 'bg-amber-500/15 border-amber-400/35 text-amber-300' },
  interview: { label: 'Interview',  variant: 'bg-violet-500/15 border-violet-400/35 text-violet-300' },
  offer:     { label: 'Offer',      variant: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300' },
  rejected:  { label: 'Rejected',   variant: 'bg-red-500/15 border-red-400/35 text-red-300' },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
})

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

  const activeApps = apps.filter(a => a.status !== 'rejected').length
  const hasOffer = apps.some(a => a.status === 'offer')

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
      {/* Hero header */}
      <motion.div {...fadeUp(0)} className="glass p-7 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-indigo-600/8 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">My Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">My Applications</h1>
            <p className="text-white/45 mt-1 text-sm">Track your progress across all your applications.</p>
          </div>
          <Link
            to="/applicant/profile"
            className="self-start md:self-center px-4 py-2 rounded-lg border border-white/12 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-all duration-200"
          >
            Edit Profile
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: totalApps, icon: '📋' },
          { label: 'Active',        value: activeApps, icon: '⚡' },
          { label: 'Offers',        value: hasOffer ? apps.filter(a => a.status === 'offer').length : 0, icon: '🎉' },
          { label: 'Skills Saved',  value: skillsQuery.data?.length ?? 0, icon: '💡' },
        ].map(({ label, value, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass px-5 py-4 text-center"
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-xs text-white/40 mt-0.5 font-medium">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Applications section */}
      <motion.section {...fadeUp(0.15)} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Applications</h2>
          {totalApps > 0 && (
            <span className="text-xs text-white/40">{totalApps} total</span>
          )}
        </div>

        {appsQuery.isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass p-5 animate-pulse space-y-3">
                <div className="h-4 w-2/3 bg-white/8 rounded" />
                <div className="h-3 w-1/2 bg-white/8 rounded" />
                <div className="h-6 w-1/3 bg-white/8 rounded-full" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="glass p-10 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-white/60 font-medium">No applications yet</p>
            <p className="text-white/35 text-sm mt-1">
              <Link to="/jobs" className="text-violet-400 hover:text-violet-300 transition-colors">Browse open roles</Link>{' '}
              and start applying.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {apps.map((app, i) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.submitted
                return (
                  <motion.div
                    key={app.application_id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="glass p-5 flex flex-col gap-3"
                  >
                    <div>
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wider truncate">
                        {app.job?.company?.name ?? 'Company'}
                      </p>
                      <h3 className="text-base font-semibold text-white mt-0.5 line-clamp-1">
                        {app.job?.title ?? 'Position'}
                      </h3>
                    </div>
                    <span
                      className={`self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.variant}`}
                    >
                      {cfg.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <Pagination
              page={page}
              totalCount={totalApps}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </motion.section>

      {/* Recommended */}
      {recommended.length > 0 && (
        <motion.section {...fadeUp(0.2)} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recommended for You</h2>
            <p className="text-sm text-white/40 mt-0.5">Based on your skill profile.</p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {recommended.map((job, i) => (
              <div key={job.job_id} className="relative">
                <JobCard job={job} index={i} />
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-600/25 border border-violet-500/35 text-violet-300">
                  {((job.score ?? 0) * 100).toFixed(0)}% match
                </span>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}
