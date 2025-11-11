import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getJobById, getOrCreateApplicant } from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import ApplicationForm from '@/components/ApplicationForm'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function JobDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const [job, setJob] = useState()
  const [applicant, setApplicant] = useState()

  useEffect(() => { (async () => {
    if (id) setJob(await getJobById(id))
    if (session) setApplicant(await getOrCreateApplicant(session.user.id, session.user.email || undefined))
  })() }, [id, session])

  if (!job) return <div className="p-6">Loading…</div>

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-4">
        <div className="text-sm text-muted">Job</div>
        <h1 className="text-3xl font-bold mt-1">{job.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          <Badge>{job.company?.name}</Badge>
          <Badge>{job.location || 'Remote'}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* Left: description */}
        <Card>
          <h3 className="font-semibold mb-3">Job Description</h3>
          <p className="text-muted leading-relaxed whitespace-pre-wrap">{job.description}</p>

          <h3 className="font-semibold mt-6 mb-2">Professional Skills</h3>
          <ul className="list-disc list-inside text-muted space-y-1">
            {(job.skills || []).map((js) => <li key={js.skill.skill_id}>{js.skill.skill_name}</li>)}
          </ul>
        </Card>

        {/* Right: overview */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3">Job Overview</h3>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between"><span>Job Type</span><span>Full time</span></div>
              <div className="flex justify-between"><span>Experience</span><span>3+ years</span></div>
              <div className="flex justify-between"><span>Location</span><span>{job.location}</span></div>
            </div>
            {session && applicant && <div className="mt-4"><Button className="w-full">Apply Job</Button></div>}
          </Card>
          {session && applicant && <ApplicationForm applicantId={applicant.applicant_id} jobId={job.job_id} />}
        </div>
      </div>
    </div>
  )
}
