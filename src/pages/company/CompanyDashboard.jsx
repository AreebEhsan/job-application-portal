export default function CompanyDashboard() {
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-6">
        {/* STYLE PROBE: if this doesn't look like a rounded, translucent, blurred card with white text, CSS isn't loading */}
        <div className="max-w-6xl mx-auto mt-8 px-4">
          <div className="glass p-6 md:p-8 transition-transform duration-300 hover:-translate-y-1">
            <h2 className="text-2xl font-bold mb-2">Visual Probe</h2>
            <p className="text-white/80">This should be inside a frosted glass card with blur, rounded corners, and white text.</p>
            <div className="mt-4 flex gap-3">
              <button className="cta">Primary Action</button>
              <a className="cta" href="/jobs">Browse Jobs</a>
            </div>
          </div>
        </div>

        {/* HERO PANEL */}
        <section className="glass p-6 md:p-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Company Dashboard</h1>
          <p className="mt-3 text-white/90">
            Add listings of jobs you posted and manage applicants here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="cta">+ Post Job</button>
            <a className="cta" href="/company/analytics">View Applicants</a>
          </div>
        </section>

        {/* CARD GRID */}
        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="glass p-5">
            <h3 className="text-lg font-semibold mb-1">Open Jobs</h3>
            <p className="text-sm text-white/80">Manage or edit your current postings.</p>
          </div>
          <div className="glass p-5">
            <h3 className="text-lg font-semibold mb-1">Applicants</h3>
            <p className="text-sm text-white/80">View applicants per role and progress status.</p>
          </div>
          <div className="glass p-5">
            <h3 className="text-lg font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-white/80">Track job performance metrics.</p>
          </div>
        </section>
      </main>
    </>
  );
}
