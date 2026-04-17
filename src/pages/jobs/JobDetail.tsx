import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJobById } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { uploadResumeFile } from '@/lib/storage'
import type { Application, ApplicationStatus } from '@/lib/types'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const STATUS_STYLES: Record<ApplicationStatus, { label: string; cls: string }> = {
  submitted:  { label: 'Submitted',  cls: 'bg-blue-500/20 border-blue-400 text-blue-100' },
  in_review:  { label: 'In Review',  cls: 'bg-amber-500/20 border-amber-400 text-amber-100' },
  interview:  { label: 'Interview',  cls: 'bg-emerald-500/20 border-emerald-400 text-emerald-100' },
  offer:      { label: 'Offer',      cls: 'bg-purple-500/20 border-purple-400 text-purple-100' },
  rejected:   { label: 'Rejected',   cls: 'bg-red-500/20 border-red-400 text-red-100' },
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = STATUS_STYLES[status]
  if (!s) return null
  return <Badge className={s.cls}>{s.label}</Badge>
}

export default function JobDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile } = useProfile()
  const queryClient = useQueryClient()

  const isApplicantRole = !!(profile?.role === 'applicant' && profile.applicant_id)

  // ─── Fetch job ──────────────────────────────────────────────────────────────
  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJobById(id),
    enabled: !!id,
  })

  // ─── Fetch existing application ─────────────────────────────────────────────
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

  // ─── Apply form state ────────────────────────────────────────────────────────
  const [applyOpen, setApplyOpen] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ─── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!toast) return
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [toast])

  // ─── Submit application mutation ─────────────────────────────────────────────
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
      setToast('Application submitted successfully.')
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

  if (loadingJob || !job) return <div className="p-6">Loading…</div>

  const appliedOn = application?.date_applied ? new Date(application.date_applied) : null
  const isApplied = !!application

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-4">
      {toast && (
        <div className="glass px-4 py-2 text-sm text-emerald-100">{toast}</div>
      )}

      <div className="mb-4 text-white">
        <div className="text-sm text-white/70">Job</div>
        <h1 className="text-3xl font-bold mt-1">{job.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
          <Badge>{job.company?.name}</Badge>
          <Badge>{job.location || 'Remote'}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* Left: description */}
        <Card>
          <h3 className="text-slate-900 font-semibold mb-3">Job Description</h3>
          <p className="text-muted leading-relaxed whitespace-pre-wrap">{job.description}</p>

          {job.skills && job.skills.length > 0 && (
            <>
              <h3 className="text-slate-900 font-semibold mt-6 mb-2">Required Skills</h3>
              <ul className="list-disc list-inside text-muted space-y-1">
                {job.skills.map(js => (
                  <li key={js.skill.skill_id}>{js.skill.skill_name}</li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Right: overview + status */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-slate-900 font-semibold mb-3">Job Overview</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between"><span>Location</span><span>{job.location || 'Remote'}</span></div>
            </div>
            <div className="mt-4">
              {!session && (
                <Button className="w-full" onClick={handleApplyClick}>Sign in to apply</Button>
              )}
              {session && isApplicantRole && !loadingApp && !isApplied && (
                <Button className="w-full" onClick={handleApplyClick}>Apply Now</Button>
              )}
              {session && isApplicantRole && isApplied && (
                <Button className="w-full" disabled>Application submitted</Button>
              )}
            </div>
          </Card>

          {session && isApplicantRole && (
            <Card className="space-y-2">
              <h3 className="text-slate-900 font-semibold">Application Status</h3>
              {loadingApp ? (
                <p className="text-sm text-muted">Checking your application…</p>
              ) : !isApplied ? (
                <p className="text-sm text-muted">You have not applied yet.</p>
              ) : (
                <div className="text-sm text-muted space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <StatusBadge status={application.status} />
                  </div>
                  {appliedOn && (
                    <p>Applied on {appliedOn.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setApplyOpen(false)}
        >
          <div className="glass max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">Apply for {job.title}</h2>
            <p className="text-sm text-muted mb-4">Submit your resume and an optional cover letter.</p>

            <form
              onSubmit={e => { e.preventDefault(); applyMutation.mutate() }}
              className="space-y-4"
            >
              {(profile?.full_name || session?.user?.email) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted">
                  <div>
                    <div className="font-medium text-white/90">Name</div>
                    <div>{profile?.full_name || '—'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-white/90">Email</div>
                    <div>{session?.user?.email || '—'}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <label className="font-medium text-white/90">Resume (PDF) *</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-white/80 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
                {resumeFile && (
                  <p className="text-xs text-white/70">
                    {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <label className="font-medium text-white/90">Cover Letter (optional)</label>
                <textarea
                  rows={4}
                  className="input min-h-[96px]"
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Briefly explain why you're a great fit."
                />
              </div>

              {submitError && <p className="text-sm text-red-400">{submitError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-w-[140px]"
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? 'Submitting…' : 'Submit application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
