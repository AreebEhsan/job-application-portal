import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn, signUp } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/context/ProfileContext'

export default function SignUp() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('applicant')
  const [authUser, setAuthUser] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile } = useProfile()

  // If already signed in, send to correct dashboard
  useEffect(() => {
    if (!session || !profile) return
    if (profile.role === 'applicant') navigate('/applicant', { replace: true })
    else if (profile.role === 'recruiter') navigate('/company', { replace: true })
  }, [session, profile, navigate])

  useEffect(() => {
    if (step === 2 && role === 'recruiter' && !companies.length) {
      ;(async () => {
        const { data } = await supabase.from('company').select('company_id, name').order('name')
        setCompanies(data || [])
        if (data && data.length) setSelectedCompanyId(data[0].company_id)
      })()
    }
  }, [step, role, companies.length])

  const handleStep1 = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(email, password)
      await signIn(email, password)
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError || !data?.user) {
        throw new Error(userError?.message || 'Could not load user after signup')
      }
      setAuthUser(data.user)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    if (!authUser) {
      setError('Missing authenticated user; please sign in again.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      if (role === 'applicant') {
        const applicant = await getOrCreateApplicant(authUser.id, authUser.email || undefined)
        const { error: profErr } = await supabase.from('profile').insert({
          user_id: authUser.id,
          role: 'applicant',
          applicant_id: applicant.applicant_id,
        })
        if (profErr) throw profErr
        navigate('/applicant/dashboard')
      } else if (role === 'recruiter') {
        let companyId = selectedCompanyId
        if (!companyId) {
          const { data: newCompany, error: compErr } = await supabase
            .from('company')
            .insert({ name: 'New Company', industry: null, location: null })
            .select('*')
            .single()
          if (compErr) throw compErr
          companyId = newCompany.company_id
        }
        const { error: profErr } = await supabase.from('profile').insert({
          user_id: authUser.id,
          role: 'recruiter',
          company_id: companyId,
        })
        if (profErr) throw profErr
        localStorage.setItem('company_id', companyId)
        navigate('/company/dashboard')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Create account</h1>

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-3">
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white w-full"
          >
            {loading ? 'Signing up…' : 'Continue'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-white/90">How will you use JobPortal?</p>
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
                onChange={() => setRole('recruiter')}
              />
              <span>I post jobs and review candidates (recruiter)</span>
            </label>
          </div>

          {role === 'recruiter' && (
            <div className="space-y-2 text-sm">
              {companies.length ? (
                <>
                  <label className="block text-white/80">Select a company</label>
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
            {loading ? 'Saving…' : 'Finish'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm">Already have an account? <Link className="underline" to="/signin">Sign in</Link></p>
    </div>
  )
}
