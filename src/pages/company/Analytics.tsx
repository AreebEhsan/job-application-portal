import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { applicantsPerJob } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'

export default function Analytics() {
  const { profile, loading: profileLoading } = useProfile()
  const companyId = profile?.company_id ?? ''

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', companyId],
    queryFn: () => applicantsPerJob(companyId),
    enabled: !profileLoading && !!companyId,
    select: rows => rows.map(r => ({ name: (r.title || r.job_id).slice(0, 18), count: r.count })),
  })

  if (!profileLoading && (!profile || profile.role !== 'recruiter' || !companyId)) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <p className="glass p-4 text-sm text-red-300">You must be a recruiter to view analytics.</p>
      </div>
    )
  }

  const totalApps = (data ?? []).reduce((sum, r) => sum + r.count, 0)
  const topJob = (data ?? []).reduce((best, r) => (r.count > (best?.count ?? -1) ? r : best), null as { name: string; count: number } | null)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-7 md:p-9 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-indigo-600/8 pointer-events-none" />
        <div className="relative">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Insights</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Application Analytics</h1>
          <p className="text-white/40 text-sm mt-1">See how applicants are engaging with your postings.</p>
        </div>
      </motion.div>

      {/* Summary stats */}
      {data && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {[
            { label: 'Total Applications', value: totalApps, icon: '📋' },
            { label: 'Jobs Posted',        value: data.length, icon: '💼' },
            { label: 'Top Role',           value: topJob?.name ?? '—', icon: '🏆', small: true },
          ].map(({ label, value, icon, small }) => (
            <div key={label} className="glass px-5 py-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`font-black text-white ${small ? 'text-base truncate' : 'text-2xl'}`}>{value}</div>
              <div className="text-xs text-white/40 mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-6 md:p-8 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Applicants per Role</h2>
          {isLoading && <span className="text-xs text-white/40">Loading…</span>}
          {isError && <span className="text-xs text-red-400">{(error as Error).message}</span>}
        </div>

        {!isLoading && (!data || data.length === 0) ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-white/40 text-sm">No data yet. Post a job and get some applicants!</p>
          </div>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data ?? []} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(14,10,28,0.92)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                    fontSize: '13px',
                  }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  )
}
