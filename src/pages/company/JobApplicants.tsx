import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { getJobApplications, updateApplicationStatus } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'
import type { ApplicationStatus } from '@/lib/types'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 15

const STATUS_OPTIONS: ApplicationStatus[] = [
  'submitted',
  'in_review',
  'interview',
  'offer',
  'rejected',
]

const STATUS_BADGE: Record<ApplicationStatus, { label: string; cls: string }> = {
  submitted: { label: 'Submitted', cls: 'bg-blue-100 border-blue-300 text-blue-800' },
  in_review: { label: 'In review', cls: 'bg-amber-100 border-amber-300 text-amber-800' },
  interview: { label: 'Interview', cls: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  offer:     { label: 'Offer',     cls: 'bg-purple-100 border-purple-300 text-purple-800' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100 border-red-300 text-red-800' },
}

export default function JobApplicants() {
  const { profile, loading: profileLoading } = useProfile()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  const enabled = !profileLoading && !!profile?.company_id && !!jobId

  // ─── Fetch job ───────────────────────────────────────────────────────────────
  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job')
        .select('job_id, title, description, company:company_id(name)')
        .eq('job_id', jobId)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Job not found or not accessible.')
      return data
    },
    enabled,
  })

  // ─── Fetch applicants (paginated) ────────────────────────────────────────────
  const appsQuery = useQuery({
    queryKey: ['job-applicants', jobId, page],
    queryFn: () => getJobApplications(jobId, page, PAGE_SIZE),
    enabled,
  })

  // ─── Status update mutation with optimistic update ───────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
      updateApplicationStatus(applicationId, status),
    onMutate: async ({ applicationId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['job-applicants', jobId, page] })
      const previous = queryClient.getQueryData(['job-applicants', jobId, page])
      queryClient.setQueryData(['job-applicants', jobId, page], (old: typeof appsQuery.data) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(a =>
            a.application_id === applicationId ? { ...a, status } : a,
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['job-applicants', jobId, page], context.previous)
      }
    },
  })

  const handleViewResume = async (resumeUrl: string) => {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resumeUrl, 60 * 10)
    if (error || !data?.signedUrl) { alert('Could not generate resume link.'); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const handleGenerateAiSuggestion = async () => {
    const job = jobQuery.data
    if (!job) return
    setAiLoading(true)
    setAiError(null)
    setAiSuggestion(null)
    try {
      const allApps = appsQuery.data?.data ?? []
      const res = await fetch('http://localhost:4000/api/gemini/applicant-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.job_id,
          jobTitle: job.title,
          jobDescription: (job as { description?: string }).description ?? '',
          applicants: allApps.map(a => ({
            id: a.application_id,
            name: a.applicant?.name ?? '',
            email: a.applicant?.email ?? '',
            cover_letter: a.cover_letter ?? '',
          })),
          chatHistory: [],
        }),
      })
      if (!res.ok) throw new Error(await res.text() || 'Failed to get AI suggestion.')
      const data = await res.json() as { message: string }
      setAiSuggestion(data.message || 'No suggestion returned.')
    } catch (e) {
      setAiError((e as Error).message || 'Failed to get AI suggestion.')
    } finally {
      setAiLoading(false)
    }
  }

  if (profileLoading) return <div className="max-w-6xl mx-auto px-4 pt-6">Loading…</div>

  if (!profile || profile.role !== 'recruiter' || !profile.company_id) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        <p className="text-sm text-red-400">
          You must be a recruiter linked to a company to view applicants.
        </p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
      </div>
    )
  }

  if (jobQuery.isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        <p className="text-sm text-red-400">{(jobQuery.error as Error).message}</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
      </div>
    )
  }

  const job = jobQuery.data
  const apps = appsQuery.data?.data ?? []
  const totalCount = appsQuery.data?.count ?? 0

  const filteredApps = statusFilter === 'all'
    ? apps
    : apps.filter(a => a.status === statusFilter)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Applicants for {job?.title ?? '…'}
          </h1>
          {job && 'company' in job && (job as { company?: { name?: string } }).company?.name && (
            <p className="text-sm text-white/80">
              {(job as { company?: { name?: string } }).company!.name}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate('/company/dashboard')}>
          Back to dashboard
        </Button>
      </div>

      <Card className="space-y-4">
        {/* Filter + count row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-muted">
            {totalCount} application{totalCount === 1 ? '' : 's'} for this job.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Status filter:</span>
            <select
              className="input bg-white border border-[#e5e7eb] rounded px-2 py-1 text-sm"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as ApplicationStatus | 'all'); setPage(1) }}
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{STATUS_BADGE[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Advisor */}
        <div className="border border-[#e5e7eb] rounded-md p-3 bg-slate-50/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">AI suggestion (beta)</p>
              <p className="text-xs text-muted">
                Uses Gemini to summarize applicants. Advisory only.
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

        {/* Table header */}
        {filteredApps.length > 0 && (
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr] gap-3 text-sm font-medium text-ink border-b border-[#e5e7eb] pb-2">
            <span>Applicant</span>
            <span>Email</span>
            <span>Date applied</span>
            <span>Status</span>
            <span>Resume</span>
          </div>
        )}

        {filteredApps.length === 0 ? (
          <p className="text-sm text-muted">No applications match this filter.</p>
        ) : (
          <div className="space-y-3">
            {filteredApps.map(app => {
              const appliedOn = app.date_applied ? new Date(app.date_applied) : null
              const statusInfo = STATUS_BADGE[app.status]
              return (
                <div
                  key={app.application_id}
                  className="glass border border-white/10 rounded-md px-3 py-3 text-sm flex flex-col md:grid md:grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr] gap-2 md:items-center"
                >
                  <div>
                    <div className="font-semibold text-ink">
                      {app.applicant?.name ?? 'Unnamed applicant'}
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{app.cover_letter}</p>
                    )}
                  </div>
                  <div className="text-ink break-words">
                    {app.applicant?.email ?? 'No email'}
                  </div>
                  <div className="text-muted">
                    {appliedOn
                      ? appliedOn.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    {statusInfo && <Badge className={statusInfo.cls}>{statusInfo.label}</Badge>}
                    <select
                      className="input bg-white border border-[#e5e7eb] rounded px-2 py-1 text-xs"
                      value={app.status}
                      disabled={statusMutation.isPending}
                      onChange={e =>
                        statusMutation.mutate({
                          applicationId: app.application_id,
                          status: e.target.value as ApplicationStatus,
                        })
                      }
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_BADGE[s].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      className="px-3 py-1 text-xs border border-white/20"
                      disabled={!app.resume_url}
                      onClick={() => app.resume_url && handleViewResume(app.resume_url)}
                    >
                      View resume
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>
    </div>
  )
}
