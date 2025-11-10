import { Link } from 'react-router-dom'

export default function JobCard({ job }) {
  return (
    <div className="rounded-2xl shadow p-4 border hover:shadow-md transition">
      <div className="text-sm text-gray-500">{job.company?.name}</div>
      <h3 className="text-xl font-semibold">{job.title}</h3>
      <div className="text-sm">{job.location}</div>
      {job.description && (
        <p className="mt-2 line-clamp-3 text-gray-700">{job.description}</p>
      )}
      <div className="mt-4">
        <Link to={`/jobs/${job.job_id}`} className="px-3 py-2 rounded-xl bg-black text-white">View</Link>
      </div>
    </div>
  )
}
