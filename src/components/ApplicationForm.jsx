import { useState } from 'react'
import { applyToJob } from '@/lib/queries'

export default function ApplicationForm({ applicantId, jobId }) {
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async () => {
    try {
      setSubmitting(true)
      await applyToJob(applicantId, jobId)
      setMsg('Application submitted!')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass p-4">
      <button onClick={submit} disabled={submitting} className="cta">
        {submitting ? 'Submitting…' : 'Apply Now'}
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  )
}
