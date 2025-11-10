import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { applicantsPerJob } from '@/lib/queries'

export default function Analytics() {
  const [data, setData] = useState([])

  useEffect(() => { (async () => {
    const company_id = localStorage.getItem('company_id') || ''
    if (!company_id) return
    const raw = await applicantsPerJob(company_id)
    setData(raw.map(r => ({ name: (r.title || r.job_id).slice(0, 12), count: r.count })))
  })() }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="glass p-4">
        <h2 className="text-xl font-semibold mb-3">Application Analytics</h2>
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
