import { useState } from 'react'
import { postJob } from '@/lib/queries'

export default function PostJob() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    try {
      await postJob({ title, location, description, company_id: companyId })
      setMessage('Job posted!')
      setTitle(''); setLocation(''); setDescription('')
    } catch (e) {
      setMessage(e.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-3xl font-bold mb-4">Post a Job</h1>
        <form onSubmit={submit} className="space-y-3">
          <input className="input" placeholder="Company ID" value={companyId} onChange={e=>setCompanyId(e.target.value)} aria-label="Company ID" />
          <input className="input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} aria-label="Job title" />
          <input className="input" placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} aria-label="Location" />
          <textarea className="input" placeholder="Description" rows={6} value={description} onChange={e=>setDescription(e.target.value)} aria-label="Description" />
          <button className="cta bg-emerald-600 hover:bg-emerald-500" aria-label="Post job">+ Post Job</button>
        </form>
        {message && <p className="text-sm mt-2">{message}</p>}
        <p className="text-sm text-white/70 mt-4">Note: Replace the Company ID field with a proper selector for companies you own and enforce via RLS.</p>
      </div>
    </div>
  )
}
