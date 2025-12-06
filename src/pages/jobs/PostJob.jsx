import { useEffect, useState } from 'react'
import { postJob } from '@/lib/queries'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabaseClient'

export default function PostJob() {
  const { profile, loading: profileLoading } = useProfile()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (profileLoading) return

    if (!profile || profile.role !== 'recruiter' || !profile.company_id) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('company')
          .select('company_id, name')
          .eq('company_id', profile.company_id)
          .maybeSingle()

        if (error) throw error
        setCompany(data)
      } catch (e) {
        setMessage(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [profileLoading, profile])

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!profile || profile.role !== 'recruiter' || !profile.company_id) {
      setMessage('You must be a recruiter linked to a company to post a job.')
      return
    }

    try {
      await postJob({
        title,
        location,
        description,
        company_id: profile.company_id, // always use recruiter’s company
      })
      setMessage('Job posted!')
      setTitle('')
      setLocation('')
      setDescription('')
    } catch (e) {
      setMessage(e.message)
    }
  }

  const missingCompany =
    !profile || profile.role !== 'recruiter' || !profile.company_id

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-3xl font-bold mb-4">Post a Job</h1>

        {profileLoading || loading ? (
          <p className="text-sm">Loading your company…</p>
        ) : missingCompany ? (
          <p className="text-sm text-red-400">
            You must be a recruiter linked to a company to post a job. Make
            sure your profile has a valid <code>company_id</code>.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm text-white/80">
              Posting on behalf of:{' '}
              <span className="font-semibold">
                {company?.name || 'Your company'}
              </span>
            </p>

            <input
              className="input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Job title"
            />
            <input
              className="input"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Location"
            />
            <textarea
              className="input"
              placeholder="Description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Description"
            />
            <button
              className="cta bg-emerald-600 hover:bg-emerald-500"
              aria-label="Post job"
              type="submit"
            >
              + Post Job
            </button>
          </form>
        )}

        {message && <p className="text-sm mt-2">{message}</p>}
      </div>
    </div>
  )
}