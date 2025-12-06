import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useProfile } from '@/context/ProfileContext'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const STATUS_OPTIONS = ['all', 'submitted', 'in_review', 'interview', 'offer', 'rejected']

function statusBadge(status) {
  if (!status) return null
  let label = status
  let extra = ''
  switch (status) {
    case 'submitted':
      label = 'Submitted'
      extra = 'bg-blue-100 border-blue-300 text-blue-800'
      break
    case 'in_review':
      label = 'In review'
      extra = 'bg-amber-100 border-amber-300 text-amber-800'
      break
    case 'interview':
      label = 'Interview'
      extra = 'bg-emerald-100 border-emerald-300 text-emerald-800'
      break
    case 'offer':
      label = 'Offer'
      extra = 'bg-purple-100 border-purple-300 text-purple-800'
      break
    case 'rejected':
      label = 'Rejected'
      extra = 'bg-red-100 border-red-300 text-red-800'
      break
    default:
      extra = 'bg-slate-100 border-slate-300 text-slate-800'
  }
  return <Badge className={extra}>{label}</Badge>
}

export default function JobApplicants() {
  const { profile, loading: profileLoading } = useProfile()
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // AI advisor state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)

  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== 'recruiter' || !profile.company_id) {
      setError('You must be a recruiter linked to a company to view applicants.')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        // Load job; RLS will ensure it belongs to this recruiter
        const { data: jobData, error: jobErr } = await supabase
          .from('job')
          .select('job_id, title, description, company:company_id(name)')
          .eq('job_id', jobId)
          .maybeSingle()

        if (jobErr) throw jobErr
        if (!jobData) {
          throw new Error('Job not found or not accessible.')
        }

        setJob(jobData)

        // Load applications with applicant info
        const { data: appRows, error: appErr } = await supabase
          .from('application')
          .select(
            'application_id, applicant_id, status, date_applied, resume_url, cover_letter, applicant:applicant_id(name, email)'
          )
          .eq('job_id', jobId)
          .order('date_applied', { ascending: false })

        if (appErr) throw appErr
        setApps(appRows || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [profileLoading, profile, jobId])

  const handleViewResume = async (appRow) => {
    if (!appRow.resume_url) return

    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(appRow.resume_url, 60 * 10)

    if (error || !data?.signedUrl) {
      // eslint-disable-next-line no-alert
      alert('Could not generate resume link.')
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId)
    try {
      const { data, error } = await supabase
        .from('application')
        .update({ status: newStatus })
        .eq('application_id', applicationId)
        .select('application_id, status')
        .single()

      if (error) throw error

      setApps((prev) =>
        prev.map((a) => (a.application_id === applicationId ? { ...a, status: data.status } : a))
      )
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message || 'Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredApps = apps.filter((a) =>
    statusFilter === 'all' ? true : a.status === statusFilter
  )

  const handleGenerateAiSuggestion = async () => {
    if (!job) return
    setAiLoading(true)
    setAiError(null)
    setAiSuggestion(null)

    try {
      // Build compact applicant summary for Gemini
      const applicantsPayload = apps.map((a) => ({
        id: a.application_id,
        name: a.applicant?.name || '',
        email: a.applicant?.email || '',
        cover_letter: a.cover_letter || '',
        // These could be extended later if you join more fields:
        skills: null,
        experience_level: null,
        university: null,
        resume_path: a.resume_url || null,
        // resume_text: null, // TODO: plug in PDF text extraction if desired
      }))

      const body = {
        jobId: job.job_id,
        jobTitle: job.title,
        jobDescription: job.description || '',
        applicants: applicantsPayload,
        chatHistory: [], // simple one-off suggestion for now
      }

      const res = await fetch('http://localhost:4000/api/gemini/applicant-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to get AI suggestion.')
      }

      const data = await res.json()
      setAiSuggestion(data.message || 'No suggestion returned.')
    } catch (e) {
      setAiError(e.message || 'Failed to get AI suggestion.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-8">Loading applicants…</div>
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-8 space-y-4">
        <p className="text-sm text-red-400">{error}</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Applicants for {job?.title}
          </h1>
          {job?.company?.name && (
            <p className="text-sm text-white/80">{job.company.name}</p>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate('/company')}>
          Back to dashboard
        </Button>
      </div>

      {/* Card uses panel + text-ink (dark) by default */}
      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-muted">
            {apps.length} application{apps.length === 1 ? '' : 's'} for this job.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Status filter:</span>
            <select
              className="input bg-white border border-[#e5e7eb] rounded px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all'
                    ? 'All'
                    : s === 'in_review'
                    ? 'In review'
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mini Gemini AI suggestion (beta) */}
        <div className="border border-[#e5e7eb] rounded-md p-3 bg-slate-50/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">AI suggestion (beta)</p>
              <p className="text-xs text-muted">
                Uses Gemini to summarize applicants based on job description and cover letters.
                Advisory only — you make the final decisions.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="text-xs px-3 py-1"
              onClick={handleGenerateAiSuggestion}
              disabled={aiLoading || apps.length === 0}
            >
              {aiLoading ? 'Generating…' : 'Generate suggestion'}
            </Button>
          </div>
          {aiError && <p className="text-xs text-red-500">{aiError}</p>}
          {aiSuggestion && (
            <p className="text-xs text-ink whitespace-pre-line">{aiSuggestion}</p>
          )}
          {!aiSuggestion && !aiError && !aiLoading && apps.length === 0 && (
            <p className="text-xs text-muted">No applicants yet to analyze.</p>
          )}
        </div>

        {filteredApps.length === 0 ? (
          <p className="text-sm text-muted">No applications match this filter.</p>
        ) : (
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr] gap-3 text-sm font-medium text-ink border-b border-[#e5e7eb] pb-2">
            <span>Applicant</span>
            <span>Email</span>
            <span>Date applied</span>
            <span>Status</span>
            <span>Resume</span>
          </div>
        )}

        <div className="space-y-3">
          {filteredApps.map((app) => {
            const appliedOn = app.date_applied ? new Date(app.date_applied) : null
            return (
              <div
                key={app.application_id}
                className="glass border border-white/10 rounded-md px-3 py-3 text-sm flex flex-col md:grid md:grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr] gap-2 md:items-center"
              >
                <div>
                  <div className="font-semibold text-ink">
                    {app.applicant?.name || 'Unnamed applicant'}
                  </div>
                  {app.cover_letter && (
                    <p className="text-xs text-muted mt-1 line-clamp-2">
                      {app.cover_letter}
                    </p>
                  )}
                </div>
                <div className="text-ink break-words">
                  {app.applicant?.email || 'No email'}
                </div>
                <div className="text-muted">
                  {appliedOn
                    ? appliedOn.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(app.status)}
                  <select
                    className="input bg-white border border-[#e5e7eb] rounded px-2 py-1 text-xs"
                    value={app.status || 'submitted'}
                    disabled={!!updatingId}
                    onChange={(e) =>
                      handleStatusChange(app.application_id, e.target.value)
                    }
                  >
                    {['submitted', 'in_review', 'interview', 'offer', 'rejected'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s === 'in_review'
                            ? 'In review'
                            : s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    className="px-3 py-1 text-xs border border-white/20"
                    disabled={!app.resume_url}
                    onClick={() => handleViewResume(app)}
                  >
                    View resume
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}