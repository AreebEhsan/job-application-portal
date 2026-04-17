import { useState } from 'react'
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

  if (isLoading) return <div className="p-6">Loading jobs…</div>
  if (isError) return <div className="p-6 text-red-400">Failed to load jobs.</div>

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6">
        <h1 className="text-3xl font-bold">Open Roles</h1>
        {totalCount > 0 && (
          <p className="text-sm text-white/70 mt-1">{totalCount} position{totalCount === 1 ? '' : 's'} available</p>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="glass p-6 text-white/70">No jobs found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map(j => <JobCard key={j.job_id} job={j} />)}
        </div>
      )}

      <Pagination
        page={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  )
}
