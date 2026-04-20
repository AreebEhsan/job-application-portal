import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { getJobApplications, updateApplicationStatus } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'
import type { ApplicationStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 15

const STATUS_OPTIONS: ApplicationStatus[] = [
  'submitted', 'in_review', 'interview', 'offer', 'rejected',
]

const STATUS_CFG: Record<ApplicationStatus, {
  label: string
  variant: NonNullable<Parameters<typeof Badge>[0]['variant']>
}> = {
  submitted: { label: 'Submitted', variant: 'indigo' },
  in_review: { label: 'In Review', variant: 'warning' },
  interview: { label: 'Interview', variant: 'violet' },
  offer:     { label: 'Offer',     variant: 'success' },
  rejected:  { label: 'Rejected',  variant: 'danger' },
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

  const appsQuery = useQuery({
    queryKey: ['job-applicants', jobId, page],
    queryFn: () => getJobApplications(jobId, page, PAGE_SIZE),
    enabled,
  })

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
      if (context?.previous) queryClient.setQueryData(['job-applicants', jobId, page], context.previous)
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

  if (profileLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="glass p-8 animate-pulse h-32" />
      </div>
    )
  }

  if (!profile || profile.role !== 'recruiter' || !profile.company_id) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        <p className="glass p-4 text-sm text-red-300">
          You must be a recruiter linked to a company to view applicants.
        </p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
      </div>
    )
  }

  if (jobQuery.isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        <p className="glass p-4 text-sm text-red-300">{(jobQuery.error as Error).message}</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
      </div>
    )
  }

  const job = jobQuery.data
  const apps = appsQuery.data?.data ?? []
  const totalCount = appsQuery.data?.count ?? 0
  const filteredApps = statusFilter === 'all' ? apps : apps.filter(a => a.status === statusFilter)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Applicants</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {job?.title ?? '…'}
          </h1>
          {job && 'company' in job && (job as { company?: { name?: string } }).company?.name && (
            <p className="text-sm text-white/40 mt-0.5">
              {(job as { company?: { name?: string } }).company!.name}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate('/company/dashboard')}>
          ← Back
        </Button>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-6 md:p-8 space-y-5"
      >
        {/* Filter row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-white/45">
            {totalCount} application{totalCount === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/40">Filter:</span>
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as ApplicationStatus | 'all'); setPage(1) }}
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{STATUS_CFG[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AI advisor */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">AI Suggestion <span className="text-xs text-white/35 font-normal ml-1">(beta)</span></p>
              <p className="text-xs text-white/40">Uses Gemini to summarize and rank applicants. Advisory only.</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateAiSuggestion}
              disabled={aiLoading || apps.length === 0}
            >
              {aiLoading ? 'Generating…' : '✨ Generate'}
            </Button>
          </div>
          {aiError && <p className="text-xs text-red-400">{aiError}</p>}
          {aiSuggestion && (
            <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed border-t border-white/8 pt-3">
              {aiSuggestion}
            </p>
          )}
        </div>

        {/* Table header */}
        {filteredApps.length > 0 && (
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-3 text-xs font-semibold text-white/35 uppercase tracking-wider border-b border-white/8 pb-2">
            <span>Applicant</span>
            <span>Email</span>
            <span>Date</span>
            <span>Status</span>
            <span>Resume</span>
          </div>
        )}

        {/* Applicant rows */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-white/40 text-sm">No applications match this filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredApps.map((app, i) => {
              const appliedOn = app.date_applied ? new Date(app.date_applied) : null
              const statusInfo = STATUS_CFG[app.status]
              return (
                <motion.div
                  key={app.application_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="p-3 rounded-xl border border-white/6 bg-white/2 hover:bg-white/5 transition-colors text-sm
                             flex flex-col md:grid md:grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-2 md:items-center"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {app.applicant?.name ?? 'Unnamed'}
                    </p>
                    {app.cover_letter && (
                      <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{app.cover_letter}</p>
                    )}
                  </div>

                  <p className="text-white/55 text-xs break-all">
                    {app.applicant?.email ?? 'No email'}
                  </p>

                  <p className="text-white/35 text-xs">
                    {appliedOn
                      ? appliedOn.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
                    <select
                      className="input w-auto text-xs px-2 py-1 h-auto"
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
                        <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!app.resume_url}
                      onClick={() => app.resume_url && handleViewResume(app.resume_url)}
                    >
                      Resume
                    </Button>
                  </div>
                </motion.div>
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
      </motion.div>
    </div>
  )
}
