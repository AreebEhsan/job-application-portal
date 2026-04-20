import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
})

const stats = [
  { value: '25,850', label: 'Open Positions' },
  { value: '10,250', label: 'Candidates Placed' },
  { value: '18,400', label: 'Companies Hiring' },
]

const featuredJobs = [
  { company: 'DataForge Labs', title: 'Frontend Engineer', tags: ['React', 'TypeScript'], desc: 'Own the UI and DX. Build polished, fast interfaces at scale.' },
  { company: 'Orbital Systems', title: 'Data Analyst', tags: ['SQL', 'Python'], desc: 'Turn raw data into actionable dashboards and insight reports.' },
  { company: 'GreenPulse', title: 'Cloud Engineer', tags: ['AWS', 'Terraform'], desc: 'Design resilient infrastructure and own the CI/CD pipeline.' },
]

const logos = ['Spotify', 'Slack', 'Adobe', 'Asana', 'Linear', 'Vercel']

export default function Home() {
  const { session } = useAuth()
  const { profile } = useProfile()

  const isApplicant = !!(session && profile?.role === 'applicant')
  const isRecruiter = !!(session && profile?.role === 'recruiter')

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-[82vh] flex items-center px-4 md:px-6 pt-4 pb-20 overflow-hidden">
        {/* Radial glow behind hero */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-r from-violet-600/16 to-indigo-600/16 blur-[120px] rounded-full" />
        </div>

        <div className="relative w-full max-w-5xl mx-auto text-center space-y-8">
          <motion.div {...fadeUp(0.1)}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-600/10 text-violet-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Now hiring at 18,000+ companies
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              <span className="text-gradient">Find Your Next</span>
              <br />
              <span className="text-white">Dream Role</span>
            </h1>
          </motion.div>

          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed">
            Browse thousands of curated positions, apply in minutes, and track every step of your journey — whether you're job hunting or building a team.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-wrap justify-center gap-3 pt-2">
            {(!session || isApplicant) && (
              <Link to="/jobs" className="cta text-base px-7 py-3">
                Browse Jobs
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            )}
            {session && isRecruiter && (
              <Link to="/company/dashboard" className="cta text-base px-7 py-3">
                Company Dashboard →
              </Link>
            )}
            {!session && (
              <Link
                to="/signup"
                className="px-7 py-3 rounded-xl font-semibold text-base border border-white/12 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                Create Account
              </Link>
            )}
            {session && isApplicant && (
              <Link
                to="/applicant/dashboard"
                className="px-7 py-3 rounded-xl font-semibold text-base border border-white/12 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                My Dashboard
              </Link>
            )}
            {session && isRecruiter && (
              <Link
                to="/company/post"
                className="px-7 py-3 rounded-xl font-semibold text-base border border-white/12 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                Post a Job
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            {...fadeUp(0.4)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto"
          >
            {stats.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="glass px-6 py-5 text-center"
              >
                <div className="text-2xl md:text-3xl font-black text-white">{value}</div>
                <div className="text-xs text-white/45 mt-1 font-medium uppercase tracking-wider">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Logo bar ───────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="border-y border-white/6 py-5"
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest w-full text-center mb-1">
            Trusted by teams at
          </p>
          {logos.map(name => (
            <span key={name} className="text-white/35 font-semibold text-sm hover:text-white/60 transition-colors cursor-default">
              {name}
            </span>
          ))}
        </div>
      </motion.section>

      {/* ── Featured Jobs ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-20">
        <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
          <div>
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-wider mb-2">Featured Roles</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Handpicked for you
            </h2>
            <p className="text-white/45 mt-2 text-sm">Fresh positions from top-tier companies.</p>
          </div>
          <Link to="/jobs" className="text-violet-400 hover:text-violet-300 text-sm font-medium whitespace-nowrap transition-colors">
            View all roles →
          </Link>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredJobs.map((job, i) => (
            <motion.div
              key={job.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass p-5 flex flex-col gap-3"
            >
              <div>
                <p className="text-xs text-white/45 font-medium uppercase tracking-wider">{job.company}</p>
                <h3 className="text-base font-semibold text-white mt-0.5">{job.title}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-600/15 border border-violet-500/25 text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-white/55 leading-relaxed flex-1">{job.desc}</p>
              <Link
                to="/jobs"
                className="self-start px-4 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-600/35 transition-all duration-200"
              >
                View role →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────── */}
      {!session && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto px-4 md:px-6 pb-16"
        >
          <div className="glass p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                Ready to land your next role?
              </h2>
              <p className="text-white/50 mb-8 text-base">
                Join thousands of candidates and companies already using JobWise.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="cta text-base px-7 py-3">
                  Get started free →
                </Link>
                <Link
                  to="/jobs"
                  className="px-7 py-3 rounded-xl font-semibold text-base border border-white/12 bg-white/5 text-white hover:bg-white/10 transition-all duration-200"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </>
  )
}
