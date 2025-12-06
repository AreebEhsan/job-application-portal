import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { applicantsPerJob } from '@/lib/queries'
import { useProfile } from '@/context/ProfileContext'

export default function Analytics() {
  const { profile, loading: profileLoading } = useProfile()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async (companyId) => {
    const raw = await applicantsPerJob(companyId)
    setData(raw.map(r => ({ name: (r.title || r.job_id).slice(0, 12), count: r.count })))
  }

  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== 'recruiter' || !profile.company_id) {
      setError('You must be a recruiter linked to a company to view analytics.')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        await loadData(profile.company_id)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [profileLoading, profile])

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-2xl font-semibold">Application Analytics</h2>
          {loading ? (
            <span className="text-sm">Loading analytics…</span>
          ) : error ? (
            <span className="text-sm text-red-400">{error}</span>
          ) : null}
        </div>
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
