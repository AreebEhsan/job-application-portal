import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Find your next job</h1>
        <p className="text-white/90 mb-6">
          Browse jobs, apply with one click, and track your applications.
        </p>
        <div className="flex gap-4">
          <Link to="/jobs" className="cta" aria-label="Browse Jobs">Browse Jobs</Link>
          <Link to="/signup" className="cta bg-emerald-600 hover:bg-emerald-500" aria-label="Create Account">Create Account</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300">
          <h3 className="text-lg font-semibold mb-2">Open Jobs</h3>
          <p className="text-sm text-white/70">Manage or edit your current postings.</p>
        </div>
        <div className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300">
          <h3 className="text-lg font-semibold mb-2">Applicants</h3>
          <p className="text-sm text-white/70">View applicants per role and progress status.</p>
        </div>
        <div className="glass p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300">
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-sm text-white/70">Track job performance metrics.</p>
        </div>
      </div>
    </div>
  )
}
