import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant, getMyCompanies } from '@/lib/queries'

export default function SelectRole() {
  const { session } = useAuth()
  const { profile, loading: profileLoading, refreshProfile } = useProfile()
  const [role, setRole] = useState('applicant')
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Redirect if no session
  useEffect(() => {
    if (!profileLoading && !session) {
      navigate('/signin', { replace: true })
    }
  }, [session, profileLoading, navigate])

  // If profile already exists and is consistent, send to dashboard
  useEffect(() => {
    if (profileLoading) return
    if (!session) return
    if (!profile) return

    if (profile.role === 'applicant' && profile.applicant_id) {
      navigate('/applicant/dashboard', { replace: true })
    } else if (profile.role === 'recruiter' && profile.company_id) {
      navigate('/company/dashboard', { replace: true })
    } else if (profile.role === 'recruiter' && !profile.company_id) {
      // Missing company_id for recruiter: load companies to link or create stub
      setRole('recruiter')
      void loadCompanies()
    } else if (profile.role === 'applicant' && !profile.applicant_id) {
      // Missing applicant_id: repair silently
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
      const applicant = await getOrCreateApplicant(session.user.id, session.user.email || undefined)
      const { error: profErr } = await supabase
        .from('profile')
        .update({ applicant_id: applicant.applicant_id })
        .eq('user_id', session.user.id)
      if (profErr) throw profErr
      await refreshProfile()
      navigate('/applicant/dashboard', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const ensureRecruiterCompany = async () => {
    if (!session) return null
    // Try to use selected company, otherwise create stub
    if (selectedCompanyId) return selectedCompanyId
    const { data, error } = await supabase
      .from('company')
      .insert({ name: 'New Company', industry: null, location: null })
      .select('*')
      .single()
    if (error) {
      throw error
    }
    return data.company_id
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!session) return
    setError(null)
    setLoading(true)
    try {
      if (role === 'applicant') {
        const applicant = await getOrCreateApplicant(session.user.id, session.user.email || undefined)
        // eslint-disable-next-line no-console
        console.log('SelectRole: creating applicant profile…', applicant)
        const { data: profData, error: profErr } = await supabase
          .from('profile')
          .upsert({
            user_id: session.user.id,
            role: 'applicant',
            applicant_id: applicant.applicant_id,
            company_id: null,
          })
          .select('*')
        if (profErr) {
          // eslint-disable-next-line no-console
          console.error('SelectRole: error upserting applicant profile', profErr)
          throw profErr
        }
        // eslint-disable-next-line no-console
        console.log('SelectRole: upserted applicant profile', profData)
        await refreshProfile()
        navigate('/applicant/dashboard', { replace: true })
      } else if (role === 'recruiter') {
        const companyId = await ensureRecruiterCompany()
        // eslint-disable-next-line no-console
        console.log('SelectRole: creating recruiter profile…', { companyId })
        const { data: profData, error: profErr } = await supabase
          .from('profile')
          .upsert({
            user_id: session.user.id,
            role: 'recruiter',
            applicant_id: null,
            company_id: companyId,
          })
          .select('*')
        if (profErr) {
          // eslint-disable-next-line no-console
          console.error('SelectRole: error upserting recruiter profile', profErr)
          throw profErr
        }
        // eslint-disable-next-line no-console
        console.log('SelectRole: upserted recruiter profile', profData)
        localStorage.setItem('company_id', companyId)
        await refreshProfile()
        navigate('/company/dashboard', { replace: true })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading && !profile) {
    return <div className="p-6">Loading profile…</div>
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Select role</h1>
      <p className="text-sm text-white/80">
        Choose how you want to use JobPortal. You can be an applicant or a recruiter.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="applicant"
              checked={role === 'applicant'}
              onChange={() => setRole('applicant')}
            />
            <span>I'm looking for jobs (applicant)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="recruiter"
              checked={role === 'recruiter'}
              onChange={() => {
                setRole('recruiter')
                if (!companies.length) void loadCompanies()
              }}
            />
            <span>I post jobs and review candidates (recruiter)</span>
          </label>
        </div>

        {role === 'recruiter' && (
          <div className="space-y-2 text-sm">
            {companies.length ? (
              <>
                <label className="block text-white/80">Link a company</label>
                <select
                  className="input"
                  value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                >
                  {companies.map(c => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="text-white/80">
                No companies found. We'll create a minimal "New Company" record for you.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white w-full"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
