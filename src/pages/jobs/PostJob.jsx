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
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Post a Job</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="border p-2 rounded w-full" placeholder="Company ID" value={companyId} onChange={e=>setCompanyId(e.target.value)} />
        <input className="border p-2 rounded w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="border p-2 rounded w-full" placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
        <textarea className="border p-2 rounded w-full" placeholder="Description" rows={6} value={description} onChange={e=>setDescription(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white">Post</button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      <p className="text-sm text-gray-500">Note: Replace the Company ID field with a proper selector for companies you own and enforce via RLS.</p>
    </div>
  )
}
