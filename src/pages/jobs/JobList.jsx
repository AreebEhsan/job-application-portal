import { useEffect, useState } from 'react'
import { getJobs } from '@/lib/queries'
import JobCard from '@/components/JobCard'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { setJobs(await getJobs()); setLoading(false) })() }, [])

  if (loading) return <div className="p-6">Loading jobs…</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Open Roles</h1>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map(j => <JobCard key={j.job_id} job={j} />)}
      </div>
    </div>
  )
}
