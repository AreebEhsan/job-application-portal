import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant, getMyCompanies } from '@/lib/queries'
import type { UserRole } from '@/lib/types'

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

  if (profileLoading && !profile) return <div className="p-6">Loading profile…</div>

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Select role</h1>
      <p className="text-sm text-white/80">Choose how you want to use JobWise.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="applicant" checked={role === 'applicant'} onChange={() => setRole('applicant')} />
            <span>I'm looking for jobs (applicant)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="recruiter" checked={role === 'recruiter'} onChange={() => { setRole('recruiter'); if (!companies.length) void loadCompanies() }} />
            <span>I post jobs and review candidates (recruiter)</span>
          </label>
        </div>

        {role === 'recruiter' && (
          <div className="space-y-2 text-sm">
            {companies.length ? (
              <>
                <label className="block text-white/80">Link a company</label>
                <select className="input" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
                  {companies.map(c => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
                </select>
              </>
            ) : (
              <p className="text-white/80">No companies found. We'll create a "New Company" record for you.</p>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-black text-white w-full disabled:opacity-60">
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
