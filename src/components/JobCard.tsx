import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  index?: number
}

export default function JobCard({ job, index = 0 }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="glass p-5 flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-white/50 font-medium uppercase tracking-wider truncate">
            {job.company?.name ?? 'Company'}
          </p>
          <h3 className="text-base font-semibold text-white mt-0.5 leading-snug line-clamp-2">
            {job.title}
          </h3>
        </div>

        <span className="shrink-0 w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-lg select-none">
          💼
        </span>
      </div>

      {job.location && (
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {job.location}
        </div>
      )}

      {job.description && (
        <p className="text-sm text-white/60 leading-relaxed line-clamp-2 flex-1">
          {job.description}
        </p>
      )}

      <Link
        to={`/jobs/${job.job_id}`}
        className="mt-1 self-start px-4 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30
                   text-violet-300 text-sm font-medium hover:bg-violet-600/35 hover:border-violet-400/50
                   transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      >
        View role →
      </Link>
    </motion.div>
  )
}
