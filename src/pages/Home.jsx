export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="min-h-[78vh] flex items-center px-4 md:px-6 pt-20">
        <div className="w-full max-w-6xl mx-auto text-center">
          <div className="glass mx-auto max-w-3xl p-8 md:p-10 space-y-4 fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Find Your Next Job
            </h1>
            <p className="text-base md:text-lg text-white/80">
              Browse, apply, and track your applications with one click.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a
                href="/jobs"
                className="px-6 py-3 rounded-md font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Browse Jobs"
              >
                Browse Jobs
              </a>
              <a
                href="/signup"
                className="px-6 py-3 rounded-md font-medium transition bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Create Account"
              >
                Create Account
              </a>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
            <div className="glass py-4 fade-in">
              <div className="text-2xl font-bold">25,850</div>
              <div className="text-white/70 text-sm">Jobs</div>
            </div>
            <div className="glass py-4 fade-in" style={{ animationDelay: "0.05s" }}>
              <div className="text-2xl font-bold">10,250</div>
              <div className="text-white/70 text-sm">Candidates</div>
            </div>
            <div className="glass py-4 fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-2xl font-bold">18,400</div>
              <div className="text-white/70 text-sm">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP (placeholder) */}
      <section className="w-full border-t border-white/10/0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80">
          <span className="text-white/70">Spotify</span>
          <span className="text-white/70">Slack</span>
          <span className="text-white/70">Adobe</span>
          <span className="text-white/70">Asana</span>
          <span className="text-white/70">Linear</span>
        </div>
      </section>

      {/* RECENT JOBS SHELL (wire your JobCard list here) */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <header className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Recent Jobs Available</h2>
            <p className="text-white/70 text-sm mt-1">
              Fresh roles from top companies — updated frequently.
            </p>
          </div>
          <a href="/jobs" className="text-emerald-300 hover:text-emerald-200 text-sm">View all</a>
        </header>

        {/* Example layout; replace with your data map */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="glass p-5">
            <div className="text-sm text-white/70">DataForge Labs</div>
            <h3 className="text-xl font-semibold mt-1">Frontend Engineer</h3>
            <p className="text-white/80 mt-2 line-clamp-2">
              Own the UI and DX. Work with React, TypeScript, Tailwind.
            </p>
            <a href="/jobs" className="mt-4 inline-block px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20">
              View
            </a>
          </div>
          <div className="glass p-5"><div className="text-sm text-white/70">Orbital Systems</div><h3 className="text-xl font-semibold mt-1">Data Analyst</h3><p className="text-white/80 mt-2 line-clamp-2">Dashboards + SQL queries.</p><a href="/jobs" className="mt-4 inline-block px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20">View</a></div>
          <div className="glass p-5"><div className="text-sm text-white/70">GreenPulse</div><h3 className="text-xl font-semibold mt-1">Cloud Engineer</h3><p className="text-white/80 mt-2 line-clamp-2">Infra as code + CI/CD.</p><a href="/jobs" className="mt-4 inline-block px-4 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20">View</a></div>
        </div>
      </section>
    </>
  );
}
