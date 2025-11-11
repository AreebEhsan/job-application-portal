import { useEffect, useState } from 'react'
import { getJobs } from '@/lib/queries'
import JobCard from '@/components/JobCard'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { setJobs(await getJobs()); setLoading(false) })() }, [])

  if (loading) return <div className="p-6">Loading jobs…</div>

  const fallback = [
    { job_id: 'demo-1', title: 'Frontend Engineer', location: 'Remote', description: 'Build gorgeous UIs.', company: { name: 'DataForge Labs' } },
    { job_id: 'demo-2', title: 'Data Analyst', location: 'Atlanta, GA', description: 'Dashboards + SQL.', company: { name: 'Orbital Systems' } },
  ]
  const list = (jobs && jobs.length ? jobs : fallback)

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6">
        <h1 className="text-3xl font-bold">Open Roles</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map(j => <JobCard key={j.job_id} job={j} />)}
      </div>
    </div>
  )
}
