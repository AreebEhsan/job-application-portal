import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

export default function Home() {
  const { session } = useAuth()
  const { profile } = useProfile()

  const isApplicant = !!(session && profile?.role === 'applicant')
  const isRecruiter = !!(session && profile?.role === 'recruiter')

  return (
    <>
      {/* HERO */}
      <section className="min-h-[78vh] flex items-center px-4 md:px-6 pt-24 pb-16">
        <div className="w-full max-w-5xl mx-auto text-center space-y-10">
          <div className="glass mx-auto max-w-3xl px-8 md:px-12 py-10 md:py-14 space-y-6 fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Find Your Next Job
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto">
              Browse, apply, and track your applications with one click  whether you're job hunting or hiring.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              {/* Primary CTA */}
              {(!session || isApplicant) && (
                <a
                  href="/jobs"
                  className="px-7 py-3 rounded-md font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label="Browse Jobs"
                >
                  Browse Jobs
                </a>
              )}
              {session && isRecruiter && (
                <a
                  href="/company"
                  className="px-7 py-3 rounded-md font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label="Go to Company Dashboard"
                >
                  Go to Company Dashboard
                </a>
              )}

              {/* Secondary CTA */}
              {!session && (
                <a
                  href="/signup"
                  className="px-7 py-3 rounded-md font-medium transition bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Create Account"
                >
                  Create Account
                </a>
              )}

              {session && isApplicant && (
                <a
                  href="/applicant"
                  className="px-7 py-3 rounded-md font-medium transition bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Go to Applicant Dashboard"
                >
                  Go to Applicant Dashboard
                </a>
              )}

              {session && isRecruiter && (
                <a
                  href="/company/post"
                  className="px-7 py-3 rounded-md font-medium transition bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Post a job"
                >
                  Post a Job
                </a>
              )}
            </div>
          </div>

          {/* STATS */}
          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl mx-auto">
            <div className="glass px-6 py-6 fade-in">
              <div className="text-xl md:text-2xl font-semibold">25,850</div>
              <div className="text-white/70 text-xs md:text-sm mt-1">Jobs</div>
            </div>
            <div className="glass px-6 py-6 fade-in" style={{ animationDelay: '0.05s' }}>
              <div className="text-xl md:text-2xl font-semibold">10,250</div>
              <div className="text-white/70 text-xs md:text-sm mt-1">Candidates</div>
            </div>
            <div className="glass px-6 py-6 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-xl md:text-2xl font-semibold">18,400</div>
              <div className="text-white/70 text-xs md:text-sm mt-1">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP (placeholder) */}
      <section className="w-full border-t border-white/10 mt-4 md:mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80">
          <span className="text-white/70">Spotify</span>
          <span className="text-white/70">Slack</span>
          <span className="text-white/70">Adobe</span>
          <span className="text-white/70">Asana</span>
          <span className="text-white/70">Linear</span>
        </div>
      </section>

      {/* RECENT JOBS SHELL (placeholder) */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-14">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Recent Jobs Available</h2>
            <p className="text-white/70 text-sm mt-1">
              Fresh roles from top companies — updated frequently.
            </p>
          </div>
          <a href="/jobs" className="text-emerald-300 hover:text-emerald-200 text-sm whitespace-nowrap">View all</a>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="glass p-5">
            <div className="text-sm text-white/70">DataForge Labs</div>
            <h3 className="text-lg md:text-xl font-semibold mt-1">Frontend Engineer</h3>
            <p className="text-white/80 mt-2 line-clamp-2">
              Own the UI and DX. Work with React, TypeScript, Tailwind.
            </p>
            <a href="/jobs" className="mt-4 inline-block px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 text-sm">
              View
            </a>
          </div>
          <div className="glass p-5">
            <div className="text-sm text-white/70">Orbital Systems</div>
            <h3 className="text-lg md:text-xl font-semibold mt-1">Data Analyst</h3>
            <p className="text-white/80 mt-2 line-clamp-2">Dashboards + SQL queries.</p>
            <a href="/jobs" className="mt-4 inline-block px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 text-sm">
              View
            </a>
          </div>
          <div className="glass p-5">
            <div className="text-sm text-white/70">GreenPulse</div>
            <h3 className="text-lg md:text-xl font-semibold mt-1">Cloud Engineer</h3>
            <p className="text-white/80 mt-2 line-clamp-2">Infra as code + CI/CD.</p>
            <a href="/jobs" className="mt-4 inline-block px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 text-sm">
              View
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
