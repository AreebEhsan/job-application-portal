import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant, getMyCompanies } from '@/lib/queries'
import { motion } from 'framer-motion'
import type { UserRole } from '@/lib/types'

const ROLES = [
  {
    value: 'applicant' as const,
    icon: '🎯',
    label: 'Job Seeker',
    desc: "Browse jobs and track applications",
  },
  {
    value: 'recruiter' as const,
    icon: '🏢',
    label: 'Recruiter',
    desc: 'Post jobs and review candidates',
  },
]

export default function SelectRole() {
  const { session } = useAuth()
  const { profile, loading: profileLoading, refreshProfile } = useProfile()
  const [role, setRole] = useState<UserRole>('applicant')
  const [companies, setCompanies] = useState<{ company_id: string; name: string }[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!profileLoading && !session) navigate('/signin', { replace: true })
  }, [session, profileLoading, navigate])

  useEffect(() => {
    if (profileLoading || !session || !profile) return
    if (profile.role === 'applicant' && profile.applicant_id) {
      navigate('/applicant/dashboard', { replace: true })
    } else if (profile.role === 'recruiter' && profile.company_id) {
      navigate('/company/dashboard', { replace: true })
    } else if (profile.role === 'recruiter' && !profile.company_id) {
      setRole('recruiter')
      void loadCompanies()
    } else if (profile.role === 'applicant' && !profile.applicant_id) {
      void repairApplicantLink()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, profile, session])

  const loadCompanies = async () => {
    try {
      const list = await getMyCompanies()
      setCompanies(list)
      if (list.length) setSelectedCompanyId(list[0].company_id)
    } catch (e) {
      console.warn('Failed to load companies', e)
    }
  }

  const repairApplicantLink = async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const applicant = await getOrCreateApplicant(session.user.id, session.user.email)
      const { error: profErr } = await supabase
        .from('profile')
        .update({ applicant_id: applicant.applicant_id })
        .eq('user_id', session.user.id)
      if (profErr) throw profErr
      await refreshProfile()
      navigate('/applicant/dashboard', { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const ensureRecruiterCompany = async (): Promise<string> => {
    if (selectedCompanyId) return selectedCompanyId
    const { data, error } = await supabase
      .from('company')
      .insert({ name: 'New Company', industry: null, location: null })
      .select('*')
      .single()
    if (error) throw error
    return data.company_id as string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setError(null)
    setLoading(true)
    try {
      if (role === 'applicant') {
        const applicant = await getOrCreateApplicant(session.user.id, session.user.email)
        const { error: profErr } = await supabase
          .from('profile')
          .upsert({ user_id: session.user.id, role: 'applicant', applicant_id: applicant.applicant_id, company_id: null })
          .select('*')
        if (profErr) throw profErr
        await refreshProfile()
        navigate('/applicant/dashboard', { replace: true })
      } else {
        const companyId = await ensureRecruiterCompany()
        const { error: profErr } = await supabase
          .from('profile')
          .upsert({ user_id: session.user.id, role: 'recruiter', applicant_id: null, company_id: companyId })
          .select('*')
        if (profErr) throw profErr
        await refreshProfile()
        navigate('/company/dashboard', { replace: true })
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading && !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass p-8 md:p-10 space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xl mb-4">
              🚀
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Choose your role</h1>
            <p className="text-sm text-white/40 mt-1">Personalize your JobWise experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setRole(r.value)
                    if (r.value === 'recruiter' && !companies.length) void loadCompanies()
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                    role === r.value
                      ? 'border-violet-500/50 bg-violet-600/15 ring-1 ring-violet-500/30'
                      : 'border-white/8 bg-white/4 hover:bg-white/8'
                  }`}
                >
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <div className="text-sm font-semibold text-white">{r.label}</div>
                  <div className="text-xs text-white/45 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>

            {role === 'recruiter' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5 overflow-hidden"
              >
                {companies.length ? (
                  <>
                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Link a company</label>
                    <select className="input" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
                      {companies.map(c => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
                    </select>
                  </>
                ) : (
                  <p className="text-xs text-white/50 bg-white/5 border border-white/8 rounded-lg px-3 py-2.5">
                    No companies found — we'll create a "New Company" record for you.
                  </p>
                )}
              </motion.div>
            )}

            {error && (
              <p className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 text-base">
              {loading ? 'Saving…' : 'Continue →'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
