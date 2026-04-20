import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { applicantsPerJob } from '@/lib/queries'
import { supabase } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
})

export default function CompanyDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const companyId = profile?.company_id ?? ''
  const enabled = !profileLoading && !!companyId

  const companyQuery = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company')
        .select('company_id, name, industry, location')
        .eq('company_id', companyId)
        .single()
      if (error) throw error
      return data
    },
    enabled,
  })

  const jobsQuery = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job')
        .select('job_id, title, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled,
  })

  const analyticsQuery = useQuery({
    queryKey: ['analytics', companyId],
    queryFn: () => applicantsPerJob(companyId),
    enabled,
  })

  if (profileLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    )
  }

  if (!profile || profile.role !== 'recruiter' || !companyId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="glass p-6 text-red-300 text-sm">
          You must be a recruiter linked to a company to view this dashboard.
        </p>
      </div>
    )
  }

  const company = companyQuery.data
  const jobs = jobsQuery.data ?? []
  const analyticsData = analyticsQuery.data ?? []
  const totalApps = analyticsData.reduce((acc, r) => acc + r.count, 0)
  const isLoading = companyQuery.isLoading || jobsQuery.isLoading

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
      {/* Hero */}
      <motion.div {...fadeUp(0)} className="glass p-7 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-indigo-600/8 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Recruiter Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              {company?.name ?? 'Company Dashboard'}
            </h1>
            <p className="text-white/45 mt-1 text-sm">Manage job postings, applicants, and analytics.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/company/post" className="cta py-2 px-5 text-sm">
              + Post Job
            </Link>
            <Link
              to="/company/analytics"
              className="px-5 py-2 rounded-xl border border-white/12 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-all duration-200"
            >
              Analytics
            </Link>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass p-6 animate-pulse space-y-3">
              <div className="h-4 w-1/2 bg-white/8 rounded" />
              <div className="h-8 w-1/3 bg-white/8 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats row */}
          <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Open Roles',       value: jobs.length,  icon: '💼' },
              { label: 'Total Applicants', value: totalApps,    icon: '👥' },
              { label: 'Industry',         value: company?.industry ?? '—', icon: '🏭', small: true },
              { label: 'Location',         value: company?.location ?? '—', icon: '📍', small: true },
            ].map(({ label, value, icon, small }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="glass px-5 py-4 text-center"
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className={`font-black text-white ${small ? 'text-base truncate' : 'text-2xl'}`}>{value}</div>
                <div className="text-xs text-white/40 mt-0.5 font-medium">{label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Jobs list */}
          <motion.div {...fadeUp(0.15)} className="glass p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Posted Jobs</h2>
              <span className="text-xs text-white/40">
                {jobs.length} job{jobs.length === 1 ? '' : 's'}
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-white/50 text-sm">No jobs posted yet.</p>
                <Link to="/company/post" className="mt-3 inline-block text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                  Post your first job →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {jobs.map((j, i) => (
                  <motion.div
                    key={j.job_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-xl hover:bg-white/4 transition-colors group"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors">
                        {j.title}
                      </p>
                      <p className="text-xs text-white/35 mt-0.5">
                        Posted{' '}
                        {j.created_at &&
                          new Date(j.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                      </p>
                    </div>
                    <Link
                      to={`/company/jobs/${j.job_id}/applicants`}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/12 hover:border-white/20 transition-all duration-200"
                    >
                      View applicants →
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
