import { useQuery } from '@tanstack/react-query'
import { applicantsPerJob } from '@/lib/queries'
import { supabase } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'

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

  if (profileLoading) return <p className="text-center text-sm mt-10">Loading…</p>
  if (!profile || profile.role !== 'recruiter' || !companyId) {
    return (
      <p className="text-center text-sm text-red-400 mt-10">
        You must be a recruiter linked to a company to view this dashboard.
      </p>
    )
  }

  const company = companyQuery.data
  const jobs = jobsQuery.data ?? []
  const totalApps = (analyticsQuery.data ?? []).reduce((acc, r) => acc + r.count, 0)
  const isLoading = companyQuery.isLoading || jobsQuery.isLoading

  const headerName = company?.name ? `Company Dashboard — ${company.name}` : 'Company Dashboard'

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 pb-10 space-y-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold">{headerName}</h1>
        <p className="text-white/70 mt-2">Manage job postings, applicants, and analytics.</p>
      </div>

      {isLoading ? (
        <p className="text-center text-sm">Loading your company…</p>
      ) : !company ? (
        <p className="text-center text-sm">No company linked to this recruiter profile.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-start">
          {/* Company summary */}
          <div className="glass p-6 hover:scale-[1.02] transition-transform space-y-3">
            <h3 className="text-xl font-semibold">{company.name}</h3>
            {company.industry && (
              <p className="text-sm text-white/80">Industry: {company.industry}</p>
            )}
            {company.location && (
              <p className="text-sm text-white/80">Location: {company.location}</p>
            )}
            <p className="text-sm text-white/80">Jobs: {jobs.length}</p>
            <p className="text-sm text-white/80">Applications: {totalApps}</p>
            <div className="flex flex-wrap gap-2 pt-2 text-sm">
              <Link
                to="/company/post"
                className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-sm"
              >
                Post Job
              </Link>
              <Link
                to="/company/analytics"
                className="px-3 py-1 rounded-md bg-white text-slate-900 hover:bg-slate-100 border border-white/30 font-medium shadow-sm"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* Jobs list */}
          <div className="md:col-span-2 glass p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold">Jobs at {company.name}</h3>
              <span className="text-xs text-white/70">
                {jobs.length} job{jobs.length === 1 ? '' : 's'}
              </span>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-white/70">No jobs have been posted yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {jobs.map(j => (
                  <div
                    key={j.job_id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-white/10 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{j.title}</div>
                      <div className="text-xs text-white/60">
                        Posted on{' '}
                        {j.created_at &&
                          new Date(j.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                      </div>
                    </div>
                    <Link
                      to={`/company/jobs/${j.job_id}/applicants`}
                      className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs border border-white/20"
                    >
                      View applicants
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
