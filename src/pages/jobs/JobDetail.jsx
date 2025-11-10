import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getJobById, getOrCreateApplicant } from '@/lib/queries'
import { useAuth } from '@/context/AuthContext'
import ApplicationForm from '@/components/ApplicationForm'

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
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{job.title}</h1>
      <div className="text-gray-600">{job.company?.name} • {job.location}</div>
      <p className="whitespace-pre-wrap">{job.description}</p>
      <h3 className="font-semibold mt-4">Required Skills</h3>
      <ul className="list-disc list-inside">
        {(job.skills || []).map((js) => <li key={js.skill.skill_id}>{js.skill.skill_name}</li>)}
      </ul>
      {session && applicant && <ApplicationForm applicantId={applicant.applicant_id} jobId={job.job_id} />}
    </div>
  )
}
