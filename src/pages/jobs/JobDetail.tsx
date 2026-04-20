import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getJobById } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { uploadResumeFile } from '@/lib/storage'
import type { Application, ApplicationStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: NonNullable<Parameters<typeof Badge>[0]['variant']> }> = {
  submitted: { label: 'Submitted', variant: 'indigo' },
  in_review: { label: 'In Review', variant: 'warning' },
  interview: { label: 'Interview', variant: 'violet' },
  offer:     { label: 'Offer',     variant: 'success' },
  rejected:  { label: 'Rejected',  variant: 'danger' },
}

export default function JobDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile } = useProfile()
  const queryClient = useQueryClient()

  const isApplicantRole = !!(profile?.role === 'applicant' && profile.applicant_id)

  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJobById(id),
    enabled: !!id,
  })

  const { data: application, isLoading: loadingApp } = useQuery<Application | null>({
    queryKey: ['application', id, profile?.applicant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application')
        .select('application_id, status, date_applied, resume_url, cover_letter')
        .eq('job_id', id)
        .eq('applicant_id', profile!.applicant_id!)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      return (data as Application) ?? null
    },
    enabled: isApplicantRole && !!id,
  })

  const [applyOpen, setApplyOpen] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!toast) return
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [toast])

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!resumeFile) throw new Error('Please upload a PDF resume.')
      const { url, error: uploadError } = await uploadResumeFile({
        applicantId: profile!.applicant_id!,
        jobId: id,
        file: resumeFile,
      })
      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('application')
        .insert({
          applicant_id: profile!.applicant_id!,
          job_id: id,
          status: 'submitted',
          resume_url: url,
          cover_letter: coverLetter || null,
        })
        .select('application_id, status, date_applied, resume_url, cover_letter')
        .single()

      if (error) {
        if (error.code === '23505') throw new Error('You have already applied to this job.')
        throw error
      }
      return data as Application
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['application', id, profile?.applicant_id] })
      void queryClient.invalidateQueries({ queryKey: ['applications', profile?.applicant_id] })
      setApplyOpen(false)
      setToast('Application submitted successfully! 🎉')
    },
    onError: (e: Error) => {
      if ((e as Error & { code?: string }).code === 'RESUME_BUCKET_NOT_FOUND') {
        setSubmitError('Resume storage is not configured. Please contact the administrator.')
      } else {
        setSubmitError(e.message || 'Failed to submit application.')
      }
    },
  })

  const handleApplyClick = () => {
    if (!session) { navigate(`/signin?redirect=/jobs/${id}`); return }
    if (!isApplicantRole) return
    setSubmitError(null)
    setResumeFile(null)
    setCoverLetter('')
    setApplyOpen(true)
  }

  if (loadingJob) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        <div className="glass p-8 animate-pulse space-y-4">
          <div className="h-4 w-1/4 bg-white/8 rounded" />
          <div className="h-8 w-2/3 bg-white/8 rounded" />
        </div>
      </div>
    )
  }

  if (!job) return null

  const appliedOn = application?.date_applied ? new Date(application.date_applied) : null
  const isApplied = !!application
  const statusCfg = application ? STATUS_CONFIG[application.status] : null

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass px-4 py-3 text-sm text-emerald-300 border border-emerald-500/30 bg-emerald-500/10"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-7 md:p-9"
      >
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Job</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.company?.name && <Badge>{job.company.name}</Badge>}
          <Badge>{job.location || 'Remote'}</Badge>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: description */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="glass p-6 md:p-8 space-y-6"
        >
          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Description</h2>
            <p className="text-white/75 leading-relaxed whitespace-pre-wrap text-sm">{job.description}</p>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(js => (
                  <span
                    key={js.skill.skill_id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-violet-600/15 border border-violet-500/25 text-violet-300"
                  >
                    {js.skill.skill_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right: overview + status */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="glass p-6 space-y-4"
          >
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Overview</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/45">Location</span>
                <span className="text-white font-medium">{job.location || 'Remote'}</span>
              </div>
            </div>

            <div className="pt-1">
              {!session && (
                <Button className="w-full" onClick={handleApplyClick}>Sign in to apply</Button>
              )}
              {session && isApplicantRole && !loadingApp && !isApplied && (
                <Button className="w-full py-2.5" onClick={handleApplyClick}>Apply Now →</Button>
              )}
              {session && isApplicantRole && isApplied && (
                <Button className="w-full" disabled>Already applied ✓</Button>
              )}
              {session && profile?.role === 'recruiter' && (
                <p className="text-xs text-white/35 text-center">Recruiters cannot apply to jobs.</p>
              )}
            </div>
          </motion.div>

          {session && isApplicantRole && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="glass p-6 space-y-3"
            >
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Application Status</h2>
              {loadingApp ? (
                <p className="text-sm text-white/35">Checking…</p>
              ) : !isApplied ? (
                <p className="text-sm text-white/35">You haven't applied yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Status</span>
                    {statusCfg && <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>}
                  </div>
                  {appliedOn && (
                    <p className="text-white/35">
                      Applied {appliedOn.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Apply modal */}
      <AnimatePresence>
        {applyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setApplyOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="glass max-w-lg w-full p-7 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-white/50 hover:text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                aria-label="Close"
              >
                ✕
              </button>

              <h2 className="text-xl font-black text-white mb-1">Apply for {job.title}</h2>
              <p className="text-sm text-white/40 mb-6">Upload your resume and optional cover letter.</p>

              <form
                onSubmit={e => { e.preventDefault(); applyMutation.mutate() }}
                className="space-y-5"
              >
                {(profile?.full_name || session?.user?.email) && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/4 border border-white/8 text-sm">
                    <div>
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-0.5">Name</p>
                      <p className="text-white/80">{profile?.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-white/80 truncate">{session?.user?.email || '—'}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Resume (PDF) *</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-white/60 rounded-lg border border-white/10 bg-white/4 px-3 py-2
                               file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0
                               file:bg-violet-600/25 file:text-violet-300 file:text-sm file:font-medium
                               hover:file:bg-violet-600/35 focus:outline-none"
                  />
                  {resumeFile && (
                    <p className="text-xs text-emerald-400">
                      ✓ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Cover Letter (optional)</label>
                  <textarea
                    rows={4}
                    className="input resize-none"
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Briefly explain why you're a great fit…"
                  />
                </div>

                {submitError && (
                  <p className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                    {submitError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setApplyOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={applyMutation.isPending} className="min-w-[140px]">
                    {applyMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                        </svg>
                        Submitting…
                      </span>
                    ) : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
