import { useEffect, useState } from 'react'
import { getJobs } from '@/lib/queries'
import JobCard from '@/components/JobCard'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { setJobs(await getJobs()); setLoading(false) })() }, [])

  if (loading) return <div className="p-6">Loading jobs…</div>

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-4">
      {jobs.map(j => <JobCard key={j.job_id} job={j} />)}
    </div>
  )
}
