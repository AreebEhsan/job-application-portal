import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getJobById, getOrCreateApplicant } from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabaseClient'
import { uploadResumeFile } from '@/lib/storage'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile } = useProfile()

  const [job, setJob] = useState(null)
  const [applicant, setApplicant] = useState(null)
  const [application, setApplication] = useState(null)
  const [loadingJob, setLoadingJob] = useState(true)
  const [loadingApp, setLoadingApp] = useState(false)

  const [applyOpen, setApplyOpen] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const isApplicantRole = !!(profile && profile.role === 'applicant' && profile.applicant_id)
  const isRecruiterRole = profile?.role === 'recruiter'
  const isApplied = !!application

  useEffect(() => {
    ;(async () => {
      if (!id) return
      try {
        setLoadingJob(true)
        const j = await getJobById(id)
        setJob(j)
      } finally {
        setLoadingJob(false)
      }
    })()
  }, [id])

  useEffect(() => {
    ;(async () => {
      if (!session || !isApplicantRole || !id) return
      setLoadingApp(true)
      try {
        const a = await getOrCreateApplicant(session.user.id, session.user.email || undefined)
        setApplicant(a)
        const { data, error } = await supabase
          .from('application')
          .select('application_id, status, date_applied, resume_url, cover_letter')
          .eq('job_id', id)
          .eq('applicant_id', profile.applicant_id)
          .maybeSingle()
        if (error && error.code !== 'PGRST116') throw error
        setApplication(data || null)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load existing application', e)
      } finally {
        setLoadingApp(false)
      }
    })()
  }, [session, isApplicantRole, profile?.applicant_id, id])

  if (loadingJob || !job) return <div className="p-6">Loading…</div>

  const handleApplyClick = () => {
    if (!session) {
      navigate(`/signin?redirect=/jobs/${job.job_id}`)
      return
    }
    if (!isApplicantRole) return
    setSubmitError(null)
    setResumeFile(null)
    setCoverLetter('')
    setApplyOpen(true)
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    if (!job || !isApplicantRole) return

    if (!resumeFile) {
      setSubmitError('Please upload a PDF resume.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const { url, error: uploadError } = await uploadResumeFile({
        applicantId: profile.applicant_id,
        jobId: job.job_id,
        file: resumeFile,
      })
      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('application')
        .insert({
          applicant_id: profile.applicant_id,
          job_id: job.job_id,
          status: 'submitted',
          resume_url: url,
          cover_letter: coverLetter || null,
        })
        .select('application_id, status, date_applied, resume_url, cover_letter')
        .single()

      if (error) {
        if (error.code === '23505') {
          setSubmitError('You have already applied to this job.')
          return
        }
        throw error
      }

      setApplication(data)
      setApplyOpen(false)
      setToast('Application submitted successfully.')
    } catch (err) {
      if (err?.code === 'RESUME_BUCKET_NOT_FOUND') {
        setSubmitError('Resume storage is not configured. Please contact the administrator.')
      } else {
        setSubmitError(err.message || 'Failed to submit application.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderStatusBadge = (status) => {
    if (!status) return null
    let label = status
    let extra = ''
    switch (status) {
      case 'submitted':
        label = 'Submitted'
        extra = 'bg-blue-500/20 border-blue-400 text-blue-100'
        break
      case 'in_review':
        label = 'In review'
        extra = 'bg-amber-500/20 border-amber-400 text-amber-100'
        break
      case 'interview':
        label = 'Interview'
        extra = 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
        break
      case 'offer':
        label = 'Offer'
        extra = 'bg-purple-500/20 border-purple-400 text-purple-100'
        break
      case 'rejected':
        label = 'Rejected'
        extra = 'bg-red-500/20 border-red-400 text-red-100'
        break
      default:
        extra = 'bg-white/10 border-white/30 text-white'
    }
    return <Badge className={extra}>{label}</Badge>
  }

  const appliedOn = application?.date_applied ? new Date(application.date_applied) : null

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-4">
      {toast && (
        <div className="glass px-4 py-2 text-sm text-emerald-100">
          {toast}
        </div>
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

          <h3 className="text-slate-900 font-semibold mt-6 mb-2">Professional Skills</h3>
          <ul className="list-disc list-inside text-muted space-y-1">
            {(job.skills || []).map((js) => <li key={js.skill.skill_id}>{js.skill.skill_name}</li>)}
          </ul>
        </Card>

        {/* Right: overview + application status */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-slate-900 font-semibold mb-3">Job Overview</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between"><span>Job Type</span><span>Full time</span></div>
              <div className="flex justify-between"><span>Experience</span><span>3+ years</span></div>
              <div className="flex justify-between"><span>Location</span><span>{job.location}</span></div>
            </div>

            {/* Apply CTA */}
            <div className="mt-4">
              {!session && (
                <Button className="w-full" onClick={handleApplyClick}>
                  Sign in to apply
                </Button>
              )}
              {session && isApplicantRole && !loadingApp && !isApplied && (
                <Button className="w-full" onClick={handleApplyClick}>
                  Apply Job
                </Button>
              )}
              {session && isApplicantRole && isApplied && (
                <Button className="w-full" disabled>
                  Application submitted
                </Button>
              )}
              {/* Recruiters see no apply button */}
            </div>
          </Card>

          {/* Application status panel for applicants */}
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
                    {renderStatusBadge(application.status)}
                  </div>
                  {appliedOn && (
                    <p>
                      Applied on{' '}
                      {appliedOn.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">Apply for {job.title}</h2>
            <p className="text-sm text-muted mb-4">Submit your resume and an optional cover letter for this job.</p>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {applicant && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted">
                  <div>
                    <div className="font-medium text-white/90">Name</div>
                    <div>{applicant.name || '—'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-white/90">Email</div>
                    <div>{applicant.email || session?.user?.email}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <label className="font-medium text-white/90">Resume (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-white/80 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
                {resumeFile && (
                  <p className="text-xs text-white/70">
                    Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
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
                  placeholder="Briefly explain why you are a great fit for this role."
                />
              </div>

              {submitError && <p className="text-sm text-red-400">{submitError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="min-w-[140px]" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
