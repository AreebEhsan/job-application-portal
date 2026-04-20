import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn, signUp } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '@supabase/supabase-js'

const ROLES = [
  {
    value: 'applicant' as const,
    icon: '🎯',
    label: 'Job Seeker',
    desc: "I'm looking for my next opportunity",
  },
  {
    value: 'recruiter' as const,
    icon: '🏢',
    label: 'Recruiter',
    desc: 'I post jobs and review candidates',
  },
]

export default function SignUp() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'applicant' | 'recruiter'>('applicant')
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [companies, setCompanies] = useState<{ company_id: string; name: string }[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile } = useProfile()

  useEffect(() => {
    if (!session || !profile) return
    if (profile.role === 'applicant') navigate('/applicant/dashboard', { replace: true })
    else if (profile.role === 'recruiter') navigate('/company/dashboard', { replace: true })
  }, [session, profile, navigate])

  useEffect(() => {
    if (step === 2 && role === 'recruiter' && !companies.length) {
      void (async () => {
        const { data } = await supabase.from('company').select('company_id, name').order('name')
        setCompanies(data ?? [])
        if (data?.length) setSelectedCompanyId(data[0].company_id)
      })()
    }
  }, [step, role, companies.length])

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(email, password)
      await signIn(email, password)
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError || !data?.user) throw new Error(userError?.message || 'Could not load user after signup')
      setAuthUser(data.user)
      setStep(2)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authUser) { setError('Missing authenticated user; please sign in again.'); return }
    setError(null)
    setLoading(true)
    try {
      if (role === 'applicant') {
        const applicant = await getOrCreateApplicant(authUser.id, authUser.email)
        const { error: profErr } = await supabase.from('profile').insert({
          user_id: authUser.id,
          role: 'applicant',
          applicant_id: applicant.applicant_id,
        })
        if (profErr) throw profErr
        navigate('/applicant/dashboard')
      } else {
        let companyId = selectedCompanyId
        if (!companyId) {
          const { data: newCompany, error: compErr } = await supabase
            .from('company')
            .insert({ name: 'New Company', industry: null, location: null })
            .select('*')
            .single()
          if (compErr) throw compErr
          companyId = newCompany.company_id as string
        }
        const { error: profErr } = await supabase.from('profile').insert({
          user_id: authUser.id,
          role: 'recruiter',
          company_id: companyId,
        })
        if (profErr) throw profErr
        navigate('/company/dashboard')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
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
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xl mb-4">
              ✨
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {step === 1 ? 'Create your account' : 'How will you use JobWise?'}
            </h1>
            <p className="text-sm text-white/40">
              {step === 1 ? 'Start your journey in seconds' : 'Pick a role to personalize your experience'}
            </p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    s === step ? 'w-8 bg-violet-500' : 'w-4 bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleStep1}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 text-base mt-2">
                  {loading ? 'Creating account…' : 'Continue →'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleStep2}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
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
                        <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Select company</label>
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
                  {loading ? 'Setting up…' : 'Finish setup →'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-white/40">
            Already have an account?{' '}
            <Link to="/signin" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
