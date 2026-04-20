import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getJobs } from '@/lib/queries'
import JobCard from '@/components/JobCard'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 12

export default function JobList() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', page],
    queryFn: () => getJobs(page, PAGE_SIZE),
  })

  const jobs = data?.data ?? []
  const totalCount = data?.count ?? 0

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Discover</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Open Roles</h1>
            {totalCount > 0 && (
              <p className="text-sm text-white/45 mt-1">
                {totalCount.toLocaleString()} position{totalCount === 1 ? '' : 's'} available
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/40">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Search coming soon</span>
          </div>
        </div>
      </motion.div>

      {/* State: loading */}
      {isLoading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass p-5 animate-pulse space-y-3">
              <div className="h-3 w-1/3 bg-white/8 rounded" />
              <div className="h-5 w-2/3 bg-white/8 rounded" />
              <div className="h-3 w-full bg-white/8 rounded" />
              <div className="h-3 w-4/5 bg-white/8 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* State: error */}
      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-8 text-center"
        >
          <p className="text-red-400 font-medium">Failed to load jobs.</p>
          <p className="text-white/40 text-sm mt-1">Please try again later.</p>
        </motion.div>
      )}

      {/* State: empty */}
      {!isLoading && !isError && jobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-12 text-center"
        >
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-white/60 font-medium">No jobs found.</p>
          <p className="text-white/35 text-sm mt-1">Check back soon for new positions.</p>
        </motion.div>
      )}

      {/* Grid */}
      {!isLoading && !isError && jobs.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j, i) => (
            <JobCard key={j.job_id} job={j} index={i} />
          ))}
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  )
}
