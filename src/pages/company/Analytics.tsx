import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { applicantsPerJob } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'

export default function Analytics() {
  const { profile, loading: profileLoading } = useProfile()
  const companyId = profile?.company_id ?? ''

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', companyId],
    queryFn: () => applicantsPerJob(companyId),
    enabled: !profileLoading && !!companyId,
    select: rows => rows.map(r => ({ name: (r.title || r.job_id).slice(0, 12), count: r.count })),
  })

  if (!profileLoading && (!profile || profile.role !== 'recruiter' || !companyId)) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <p className="text-sm text-red-400">You must be a recruiter to view analytics.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-2xl font-semibold">Application Analytics</h2>
          {isLoading && <span className="text-sm">Loading analytics…</span>}
          {isError && (
            <span className="text-sm text-red-400">
              {(error as Error).message}
            </span>
          )}
        </div>
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data ?? []}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
