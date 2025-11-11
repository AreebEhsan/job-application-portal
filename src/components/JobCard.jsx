import { Link } from 'react-router-dom'

export default function JobCard({ job }) {
  return (
    <div className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300">
      <div className="text-sm text-white/80">{job.company?.name}</div>
      <h3 className="text-xl font-semibold mt-1">{job.title}</h3>
      <div className="text-sm text-white/80">{job.location}</div>
      {job.description && (
        <p className="mt-2 line-clamp-3 text-white/90">{job.description}</p>
      )}
      <div className="mt-4">
        <Link to={`/jobs/${job.job_id}`} className="cta">View</Link>
      </div>
    </div>
  )
}
